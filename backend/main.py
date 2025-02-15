import time
from byaldi import RAGMultiModalModel
import logging
import base64
from fastapi import FastAPI, File, UploadFile
import os
import shutil
import asyncio

app = FastAPI()

RAG = None
UPLOAD_FOLDER = 'uploads/'
GLOBAL_FILE = 1

@app.on_event("startup")
def init(device='mps', verbose=0):
    global RAG, UPLOAD_FOLDER
    UPLOAD_FOLDER = "uploads"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    RAG = RAGMultiModalModel.from_pretrained("vidore/colpali-v1.2", verbose=verbose, device=device)

@app.post("/upload_image")
async def add_document_to_image(file: UploadFile = File(...)):
    global GLOBAL_FILE
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

    RAG.index(
        input_path=file_path,
        index_name="zoom_query_path",
        store_collection_with_index=True,
        overwrite=True
    )

    return {"filename": file.filename, "uploaded": True}

@app.post("/query")
async def search2(query: str):
    images = RAG.search(query)
    print(images)
    if len(images) == 0:
        print("image length is None")
        return { 'data': None }
    
    # for image in images:
        # image['base64'] = base64.b64encode(images[0]['base64'].encode('utf-8')).decode('utf-8')
    print(images)
    return { 'data': images}


# if __name__ == "__main__":
    # init()
    # add_document_to_image("image.png")
    # image_search = search("What is the capital of France?")
    # print(image_search)


