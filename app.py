from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
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
import time
import numpy as np
import celery
from celery import Celery
import redis
from model_manager import ModelManager

model_manager = ModelManager()

#create a celery app
celery_app = Celery(
    "RetainBackendCelery", 
    broker="redis://localhost:6379/0", 
    backend="redis://localhost:6379/0"  
)

celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


class VideoFrame(BaseModel):
    video_data: str
    timestamp: int

TIME_BETWEEN_FRAMES = 5
last_frame_timestamp = time.time()

# RAG = RAGMultiModalModel.from_pretrained(pretrained_model_name_or_path="/Users/yahiasalman/Desktop/RetainAll/RetainBackend/app/models/colqwen2-v1.0", index_root="./index", device="mps")
# RAG = RAGMultiModalModel.from_index("./TreeIndex", index_root="./index", device="mps")
RAG = model_manager.get_model(device="mps")
# RAG.index(input_path="./saved_frame.jpg", index_name="TreeIndex", store_collection_with_index=True, overwrite=True)

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

async def search_transcript_index(query: str):
    return search_similar(query)

@celery_app.task
def add_to_index(file_path: str):
    try:
        # Initialize RAG model inside the worker process
        RAG = model_manager.get_model(device="mps")
        
        # Read the image and convert to base64
        with open(file_path, "rb") as image_file:
            image_data = image_file.read()
            base64_data = base64.b64encode(image_data).decode('utf-8')
        
        # Add to index with base64 in metadata
        RAG.add_to_index(
            input_item=file_path, 
            store_collection_with_index=True,
            # metadata={"base64": base64_data}
        )
        
        os.remove(file_path)
        return {"message": "Successfully added to index"}
    except Exception as e:
        print(f"Error adding to index: {str(e)}")
        os.remove(file_path)
        return {"error": str(e)}
    

@app.on_event("startup")
async def startup_event():
    #check if the index exists by checking if the folder exists
    if os.path.exists("./index/TreeIndex"):
        print("Index exists")
    else:
        print("Index does not exist")
        initialize_index()


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
async def search_both_for_chat(query: str):
    similar_sentences = search_similar(query)
    vlm_results = search_vlm_index(query)
    return {"similar_sentences": similar_sentences, "vlm_results": vlm_results}

# @app.post("/add-to-index")
# async def add_to_index(upload_file: UploadFile):
#     num = random.randint(0, 1000000)
#     with open(f"/temp_files_for_indexing/temp_frame_{num}.jpg", "wb") as f:
#         f.write(upload_file.file.read())
#     RAG.add_to_index(input_item=f"/temp_files_for_indexing/temp_frame_{num}.jpg", store_collection_with_index=True)
#     os.remove(f"/temp_files_for_indexing/temp_frame_{num}.jpg")
#     return {"message": "Successfully added to index"}


@app.post("/convert-video")
async def convert_video(request: Request):
    try:
        print("SHAMZY")
        print(request.body())
        # Read the raw bytes
        body = await request.body()
        
        # Convert to numpy array
        nparr = np.frombuffer(body, np.uint8)
        
        print(nparr, "shamzy")
        # Decode the WebM video frame
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        print(frame, "shamzy")
        #save the frame locally
        with open(f"temp_frame_{2}.jpg", "wb") as f:
            f.write(frame)
        
        if frame is None:
            return {"error": "Failed to decode video frame"}
            
        # Convert to JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        # Convert to base64
        frame_data = base64.b64encode(buffer).decode('utf-8')
        print("SHAMZY")
        #save the image locally
        with open(f"temp_frame_{2}.jpg", "wb") as f:
            f.write(buffer)
        
        return {
            "frame_data": frame_data,
            "timestamp": str(int(time.time() * 1000))
        }
    except Exception as e:
        print(f"Error converting video: {str(e)}")
        return {"error": str(e)}
    

@app.post("/process-frame")
async def process_frame(request: Request):
    global last_frame_timestamp
    if time.time() - last_frame_timestamp < TIME_BETWEEN_FRAMES:
        print("HERE")
        print(time.time() - last_frame_timestamp)
        return {"error": "Too many requests"}
    last_frame_timestamp = time.time()
    try:
        print("HERE2")
        random_num = random.randint(0, 1000000)
        # Get raw bytes from request body
        body = await request.body()
        
        # Convert to numpy array
        nparr = np.frombuffer(body, np.uint8)
        
        # Decode image
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"error": "Failed to decode frame"}
        
        # Resize for consistency
        frame = cv2.resize(frame, (640, 480))
        
        # Encode as JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        # Convert to base64
        frame_data = base64.b64encode(buffer).decode('utf-8')
        
        
        #save the image locally
        with open(f"temp_frame_{random_num}.jpg", "wb") as f:
            f.write(buffer)
        
        print("ADDING TO DELAY CELERY")
        #add the image to the index
        add_to_index(f"temp_frame_{random_num}.jpg")
        print("ADDED TO DELAY CELERY")
        return {
            "frame_data": frame_data,
            "timestamp": int(time.time() * 1000)
        }
        
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        return {"error": str(e)}
    
if __name__ == "__main__":
    #test retreiving from index with search_vlm_index
    images = search_vlm_index("What is yahia's favorite color?")
    # iterate through the images and save them locally
    for i, image in enumerate(images):
        # Convert base64 string back to bytes before writing
        image_bytes = base64.b64decode(image.base64)
        with open(f"temp_frame_{i}.jpg", "wb") as f:
            f.write(image_bytes)
    
