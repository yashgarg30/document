# MERN OCR Document Search (prototype)

This repository contains a prototype MERN-stack document search pipeline using Tesseract.js for OCR, a Redis-backed Bull queue for asynchronous page-by-page OCR, and a React frontend.

Quick start (development)

1. Install prerequisites
   - Docker & Docker Compose (for MongoDB and Redis)
   - Node.js 16+ and npm
   - (Optional, required for PDF -> PNG conversion) Poppler utils (pdftoppm). On Windows you can install Poppler and add it to PATH.

2. Start infra services (MongoDB and Redis):

   Open a PowerShell and run:

   cd infra
   docker-compose up -d

3. Start everything (recommended):

   From the repository root run the helper script (Windows PowerShell):

   .\\start-all.ps1

   This opens separate windows for infra, backend, worker and frontend.

Manual start sequence

- Backend (API + Socket):
  cd backend
  npm install
  node src/server.js

- Worker (OCR queue worker):
  cd backend
  npm run worker

- Frontend (React):
  cd frontend
  npm install
  npm start

How to use

1. Open the frontend at http://localhost:3000
2. Upload a PDF or an image (PNG/JPG/TIFF).
   - If you upload a PDF, make sure `pdftoppm` (poppler) is installed and on PATH so pages can be converted to PNG for OCR.
3. After upload the UI will show per-page progress via WebSockets.
4. When processing finishes, you can search the extracted text using the search box.

Troubleshooting

- Socket connection refused / WebSocket errors:
  - Ensure the backend is running on port 4000 and reachable: http://localhost:4000/health
  - Ensure the frontend and backend origins match CORS (frontend http://localhost:3000, backend http://localhost:4000)
  - If the socket still fails, refresh the frontend and watch backend logs for connection attempts.

- PDF fails to convert:
  - Install Poppler (pdftoppm). On Windows you can get Poppler builds and add the bin folder to PATH.

- MongoDB errors (buffering timed out):
  - Ensure Mongo container is up (docker ps). See `infra/docker-compose.yml`.

Next steps / Productionization

- Containerize backend and worker in docker-compose so everything runs as containers.
- Add authentication flows and role-based access for documents.
- Add file virus scanning hook and file size quotas.
- Add robust PDF rendering fallback (e.g., pdf.js) when Poppler is not available.
- Add tests and CI for OCR accuracy and search relevance.

If you'd like, I can:
- Containerize the backend & worker in docker-compose now so you can `docker-compose up` everything; or
- Add automated tests and seed data; or
- Walk through installing Poppler and testing a PDF upload.

