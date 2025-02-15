import chromadb
import openai



# Connect to ChromaDB (runs locally)
client = chromadb.PersistentClient(path="./chroma_db")

# Create a collection
collection = client.get_or_create_collection(name="sentences")

def get_embedding(text):
    client = openai.OpenAI(api_key="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")
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

# Add sentences
# sentences = [
#     "The Eiffel Tower in Paris stands at 324 meters tall.",
#     "Photosynthesis is how plants convert sunlight into energy.",
#     "The human brain contains approximately 86 billion neurons.",
#     "Mount Everest is the highest peak on Earth.",
#     "Shakespeare wrote 37 plays during his lifetime.",
#     "DNA carries genetic information in all living organisms.",
#     "The speed of light is approximately 299,792 kilometers per second.",
#     "Ancient Egyptians built the pyramids as tombs for their pharaohs.",
#     "The Pacific Ocean is the largest and deepest ocean on Earth.",
#     "Vincent van Gogh painted 'The Starry Night' in 1889.",
#     "The Industrial Revolution began in Britain in the late 18th century.",
#     "Jupiter is the largest planet in our solar system.",
#     "The Great Wall of China is over 21,000 kilometers long.",
#     "Mozart composed his first symphony at the age of eight.",
#     "The human body contains about 60% water.",
#     "World War II ended in 1945.",
#     "Today's lecture is about Newton's laws of motion.",
#     "Gravity is a fundamental force of nature.",
#     "Acceleration is the rate of change of velocity.",
#     "Friction opposes motion.",
#     "The first computer program was written by Ada Lovelace.",
#     "Bees perform a waggle dance to communicate flower locations.",
#     "The Mona Lisa was painted by Leonardo da Vinci.",
#     "The theory of relativity was developed by Albert Einstein."
# ]

# for i, sentence in enumerate(sentences):
#     collection.add(ids=[str(i)], embeddings=[get_embedding(sentence)], metadatas=[{"text": sentence}])

# print("Sentences stored in ChromaDB!")


def search_similar(query):
    query_vector = get_embedding(query)
    results = collection.query(query_embeddings=[query_vector], n_results=10)
    return [hit["text"] for hit in results["metadatas"][0]]

# query = "What are Newton's laws?"
# similar_sentences = search_similar(query)

# print("\nTop 10 Closest Sentences:")
# for sentence in similar_sentences:
#     print(f"{sentence}")

def delete_all_embeddings():
    client.delete_collection("sentences")  # Removes all embeddings
    collection = client.get_or_create_collection(name="sentences")

# delete_all_embeddings()
if __name__ == "__main__":
    delete_all_embeddings()