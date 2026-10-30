# AuditTrail

Angular frontend and FastAPI backend, packaged together in one container.

```text
AuditTrail/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── test/test_main.py
├── frontend/
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Run with Docker

```bash
docker compose up --build -d
```

Open http://localhost:8000 and click **Check Backend Connection**. Angular sends
`GET /health` to the same host and displays **Backend Online** only when the
backend returns HTTP 200 and `{"status":"OK"}`. Failed or unexpected responses
show an error; requests time out after 10 seconds and can be retried.

## Develop locally

Use Python 3.13 and Node.js 22.12+ (or Node.js 20.19+).

Start the backend from the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
uvicorn backend.main:app --reload --port 8000
```

In another terminal, start Angular:

```bash
cd frontend
npm ci
npm start
```

Open http://localhost:4200. The development proxy forwards `/health` to the local
backend. In the container, FastAPI serves the built frontend directly on port 8000.
No browser API URL or CORS configuration needs to change between environments.

## Verify

```bash
cd frontend
npm ci
npm run build
npm test
```

Then from the project root:

```bash
.venv/bin/python -m pytest
```

The Python tests also check that the built Angular page is served when its build
output is present. The frontend-serving test is skipped before Angular is built.

## Azure Container Apps

Deploy this repository's Dockerfile as a single container. It builds Angular in a
Node stage, then copies only the generated browser files into the Python image.
Configure external HTTP ingress with target port **8000** and HTTP readiness and
liveness probes at **/health**, port **8000**. Docker Compose is for local use;
configure cloud health probes separately.

With Azure CLI installed and signed in, the following commands create cloud
resources and deploy the application (Azure charges may apply):

```bash
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az containerapp up --name audittrail --resource-group audittrail-rg --location westeurope --source . --ingress external --target-port 8000
```

See Microsoft's [Container Apps deployment guide](https://learn.microsoft.com/en-us/azure/container-apps/containerapp-up).
When building an image locally for Container Apps, target `linux/amd64` and use a
unique image tag for each deployment.

After deployment, open the returned HTTPS URL and click **Check Backend Connection**.
You should see **Backend Online**. In browser developer tools, the Network tab
shows the `/health` request and its HTTP 200 response. Testing at the public cloud
URL verifies Internet reachability; a local check only verifies your local setup.

## Google Cloud Run

The container reads the `PORT` environment variable at startup and defaults to
8000 when it is absent. Cloud Run supplies `PORT` automatically, typically 8080.
Keep the Cloud Run container port at 8080 and build from the root Dockerfile.
Leave container command and argument overrides empty to use the image's startup
command. After pushing a Dockerfile change, wait for a new image to be built and
deploy that image; redeploying the old image does not include the change.

See Google's [container runtime contract](https://docs.cloud.google.com/run/docs/container-contract).
