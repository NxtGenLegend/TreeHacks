from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


RAG = RAGMultiModalModel.from_pretrained(pretrained_model_name_or_path="/Users/yahiasalman/Desktop/RetainAll/RetainBackend/app/models/colqwen2-v1.0", index_root="./index", device="mps")
# RAG.index(input_path="./saved_frame.jpg", index_name="TreeIndex")

seen = set()
# Connect to ChromaDB (runs locally)
client = chromadb.PersistentClient(path="./chroma_db")

# Create a collection
collection = client.get_or_create_collection(name="sentences")

app = FastAPI()

# Add CORS middleware to allow requests from your web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual origin
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
    return RAG.search(query=query, k=3)

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
