# AI Job Application Assistant

Full-stack AI assistant for generating tailored resumes and cover letters using Google Gemini.

## Local Development (Client-Side Mode)
This project is currently configured to run as a **Client-Side SPA** for demonstration purposes.
1. `npm install`
2. `npm start`
3. Enter your Gemini API Key in `index.tsx` or `.env`.

## Backend Deployment (Google Cloud Run)

### Prerequisites
1. Google Cloud Project with Billing enabled.
2. `gcloud` CLI installed.
3. MongoDB Atlas URI.
4. Gemini API Key.

### Steps

1. **Build Container**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/job-assistant-api
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy job-assistant-api \
     --image gcr.io/YOUR_PROJECT_ID/job-assistant-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_key,DB_URI=your_mongo_uri,JWT_SECRET=secure_random_string"
   ```

3. **Verify**
   Visit the URL provided by the Cloud Run output.

## Architecture
- **Frontend**: React (served via Express static in prod, or Vite in dev).
- **Backend**: Node.js, Express.
- **AI**: Google Gemini Pro/Flash.
- **Database**: MongoDB.
