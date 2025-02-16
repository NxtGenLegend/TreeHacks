
## Installation & setup

This app requires [FFmpeg](https://github.com/FFmpeg/FFmpeg) and [Node.js version 14]() or higher.

The app can be run locally by cloning and installing packages with npm or on [Docker](https://www.docker.com/).

**npm** <br/>
To setup with npm, install dependencies and run the app:

```bash
cd rtms-mock-server-sample

# Install dependencies
npm install

# Start the server
npm start
```

**Docker** <br/>
To setup with Docker, run the following:

```bash
cd rtms-mock-server-sample

# Option 1: Using docker-compose (recommended)
docker-compose up -d

# Option 2: Manual docker commands

# Build Docker image
docker build -t rtms-mock-server .

# Run the container
docker run -d \
  -p 9092:9092 \
  -p 8081:8081 \
  -v $(pwd)/data:/app/data \
  --name rtms-mock-server \
  rtms-mock-server

# View logs
docker logs -f rtms-mock-server
```

To stop the container:

```bash
docker stop rtms-mock-server
```

To restart the container:

```bash
docker start rtms-mock-server
```

## Using the sample client

Start the server (npm or Docker) and open the mock server at [http://localhost:9092](http://localhost:9092). The sample client at `./client` can now be used to consume media from the mock server.

In a new terminal, run the sample client:

```bash
node client/server.js
```

This opens up a server at `localhost:8000`. For webhook validation, the client will need to be exposed to the internet with a tunnel, like [ngrok](https://ngrok.com/).

```bash
ngrok http 8000
```

The ngrok URL will be used to validate the webhook endpoint. Copy your URL and paste it into the webhook URL field on the mock server (http://localhost:9092). Click validate. In the RTMS server and client you'll see confirmation of the validation.

You can now start a meeting and start streaming media to the client.

## To run the backend

Delete the current index from the indexes folder

run 

```bash
python3 reset_everything.py
```

comment out this line in the app.py: 
```bash
RAG = model_manager.get_model(device="mps")
```

and uncomment these

```bash
RAG = RAGMultiModalModel.from_pretrained(pretrained_model_name_or_path="/Users/yahiasalman/Desktop/RetainAll/RetainBackend/app/models/colqwen2-v1.0", index_root="./index", device="mps")
RAG.index(input_path="./saved_frame.jpg", index_name="TreeIndex", store_collection_with_index=True, overwrite=True)
```

and run 
```bash
python3 app.py
```

then you can run 

```bash
./start.sh
```

and the server should start running on port 8010

Make sure that you have redis and celery installed!


