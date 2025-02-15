from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
import base64
import chromadb
import openai
import random
from byaldi import RAGMultiModalModel
from pydantic import BaseModel
import cv2
import numpy as np

class VideoFrame(BaseModel):
    video_data: str
    timestamp: int


RAG = RAGMultiModalModel.from_pretrained(pretrained_model_name_or_path="vidore/colqwen2-v1.0", index_root="./index", device="mps")
# RAG.index(input_path="./saved_frame.jpg", index_name="TreeIndex")
VLM_RAG = RAGMultiModalModel.from_pretrained(pretrained_model_name_or_path="vidore/colqwen2-v1.0", index_root="./vlm_index", device="mps")

seen = set()
# Connect to ChromaDB (runs locally)
client = chromadb.PersistentClient(path="./chroma_db")

# Create a collection
collection = client.get_or_create_collection(name="sentences")

app = FastAPI()

# Add CORS middleware to allow requests from your web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", 'http://localhost:5173'],  # In production, replace with your actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_embedding(text):
    client = openai.OpenAI(api_key="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")
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def search_similar(query):
    query_vector = get_embedding(query)
    results = collection.query(query_embeddings=[query_vector], n_results=10)
    return [hit["text"] for hit in results["metadatas"][0]]

def delete_all_embeddings():
    client.delete_collection("sentences")  # Removes all embeddings
    collection = client.get_or_create_collection(name="sentences")
    
def add_embedding(text):
    collection.add(ids=[str(len(seen))], embeddings=[get_embedding(text)], metadatas=[{"text": text}])

def initialize_index():
    RAG.index(input_path="./saved_frame.jpg", index_name="TreeIndex")

def search_vlm_index(query):
    return VLM_RAG.search(query=query, k=3)

def get_embedding(text):
    client = openai.OpenAI(api_key="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")
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding


@app.post("/add-to-db")
async def add_to_db(body: dict):
    print(body['message']['data'])
    if body['message']['data'] not in seen:
        seen.add(body['message']['data'])
        add_embedding(body['message']['data'])
        print("Not seen")
        return {"message": "Successfully added to database"}
    else:
        return {"message": "Already seen"}
    
@app.post("/search")
async def search_transcript_index(body: dict):
    return {"message": search_similar(body['message']['data'])}

@app.post("/add-to-index")
async def add_to_index(upload_file: UploadFile):
    num = random.randint(0, 1000000)
    with open(f"/temp_files_for_indexing/temp_frame_{num}.jpg", "wb") as f:
        f.write(upload_file.file.read())
    RAG.add_to_index(input_item=f"/temp_files_for_indexing/temp_frame_{num}.jpg", store_collection_with_index=True)
    os.remove(f"/temp_files_for_indexing/temp_frame_{num}.jpg")
    return {"message": "Successfully added to index"}

@app.post("/convert-video")
async def convert_video(body: dict):
    try:
        print(body)
        # Decode base64 video data
        video_bytes = base64.b64decode(body['data'])
        
        # Convert to numpy array
        nparr = np.frombuffer(video_bytes, np.uint8)
        
        # Read the video frame
        video = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if video is None:
            raise HTTPException(status_code=400, detail="Failed to decode video data")
        
        # Convert to JPEG
        _, buffer = cv2.imencode('.jpg', video, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        # Convert back to base64
        frame_data = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "frame_data": frame_data,
            "timestamp": body['timestamp']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search_chroma")
async def search_chroma(query: str):
    global client
    global collection
    query_vector = get_embedding(query)
    results = collection.query(query_embeddings=[query_vector], n_results=10)
    return {'data': [hit["text"] for hit in results["metadatas"][0]]}


UPLOAD_FOLDER = 'uploads/'
GLOBAL_FILE = 1

@app.on_event("startup")
def init(device='mps', verbose=0):
    global UPLOAD_FOLDER
    UPLOAD_FOLDER = "uploads"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)\

@app.post("/upload_image")
async def add_document_to_image(file: UploadFile = File(...)):
    global GLOBAL_FILE
    global VLM_RAG
    file_path = os.path.join(UPLOAD_FOLDER, f"image_{GLOBAL_FILE}.png")
    try:
        contents = file.file.read()
        with open(file_path, 'wb') as f:
            f.write(contents)
    except Exception:
        raise {'status_code': 500, 'detail': 'Something went wrong'}
    finally:
        file.file.close()

    GLOBAL_FILE += 1

    VLM_RAG.index(
        input_path=file_path,
        index_name="vlm_index",
        store_collection_with_index=True,
        overwrite=True
    )

    return {"filename": file.filename, "uploaded": True}

@app.post("/upload_image")
async def upload_image(request: Request):
    file_path = './uploaded_files/image.png'
    try:
        # Read the raw binary data
        file_data = await request.body()

        # Save the binary data to a file
        with open(file_path, 'wb') as f:
            f.write(file_data)

        return {"message": "File uploaded successfully"}
    except Exception as e:
        return {"detail": f"Error uploading file: {str(e)}"}

# @app.options("/query_vlm")
# async def preflight_handler(request: Request):
#     return {"message": "Preflight OK"}

# @app.post("/query_vlm")
# async def search2(query: str):
#     images = search_vlm_index(query)
#     if len(images) == 0:
#         print("image length is None")
#         return { 'data': None }
    
#     return { 'data': images}

class QueryRequest(BaseModel):
    query: str

@app.post("/query_vlm")
async def search2(request: QueryRequest):
    images = search_vlm_index(request.query)
    response = JSONResponse(content={"data": images})
    
    # Set CORS headers for this route only
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response