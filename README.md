# Gemini LifeOS: Production-Oriented AI Reflection & Life Operating System

Gemini LifeOS is a cloud-native, user-authenticated personal reflection engine and goal tracker powered by Google Gemini and Cloud Firestore. Built with strict tenant data isolation, server-side credential management via Google Cloud Secret Manager, and an automated Gemini model fallback ladder.

---

## 1. System Architecture & Threat Summary

### A. Threat Model & Countermeasures

| Threat Zone | Identified Attack Vector / Risk | OWASP / LLM Category | Architectural Countermeasure Implemented |
| :--- | :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection payloads, oversized journal transcripts, XSS in markdown. | OWASP A03 / LLM02 | Express payload size bounds (1MB), sanitization utilities, and safe ReactMarkdown rendering. |
| **Reasoning Layer** | Indirect prompt injection through user inputs attempting system override. | OWASP LLM01 | Structural prompt framing with isolated system instructions and context separation. |
| **Tool / API Execution** | Secret exfiltration, SSRF, quota abuse by unauthenticated clients. | OWASP A01 / LLM05 | Zero client-side API keys. Express `/api/gemini/*` proxies verify Bearer JWT tokens before model calls. |
| **Memory & State** | Tenant data leakage, unauthorized cross-account read/writes. | OWASP A01 / Broken Access Control | Owner-bound Firestore security rules (`request.auth.uid == userId`) isolating `/users/{uid}/*`. |
| **Secrets & Keys** | Hardcoded credentials in client bundles or public repositories. | OWASP A02 / A07 | Dynamic environment / Secret Manager resolution on the backend. Zero client-side API keys. |

---

## 2. Firestore Security Rules (`firestore.rules`)

Deploy this configuration to enforce strict owner-bound data isolation across all documents:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Zero insecure defaults: deny all root unmatched reads/writes
    match /{document=**} {
      allow read, write: if false;
    }

    // Owner-bound user isolated workspace
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /insights/{insightId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 3. Secret Manager Configuration & IAM Setup

Configure Google Cloud Secret Manager to securely supply the Gemini API key to Cloud Run without hardcoding:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add your Gemini API Key as a version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant your Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Google Cloud Run Deployment Guide

Deploy Gemini LifeOS to Google Cloud Run with the required campaign tracking labels and Secret Manager binding:

```bash
# 1. Enable Cloud Run and Artifact Registry APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# 2. Deploy directly from source to Cloud Run
gcloud run deploy gemini-lifeos \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --update-labels dev-tutorial=cloud-run-ai-challenge

# 3. Verify deployed service status and URL
gcloud run services describe gemini-lifeos --region us-central1
```

---

## 5. Resilient Gemini Fallback Ladder

The backend service wraps all AI requests with an automated fallback ladder to ensure zero downtime:
1. `gemini-2.5-flash` (Primary high-speed reflection engine)
2. `gemini-2.5-flash-lite` (High-availability failover)
3. `gemini-2.5-pro` (Deep reasoning & synthesis fallback)

---

## 6. End-to-End Walkthrough & Testing Checklist

Use this structured test matrix to verify all functional modules:

### Test Case 1: Google Authentication & Owner Identity
1. Navigate to the landing page and click **"Continue with Google"** / **"Get Started with Google Auth"**.
2. Verify that your authenticated user profile appears in the top navigation header with unique UID binding.
3. Verify that your private dashboard loads isolated counters and zero entries from other users.

### Test Case 2: Multi-Turn Journal Conversation & Auto-Save
1. On the dashboard, click **"Start New Reflection"**.
2. Enter a title (e.g. *"Q3 Strategic Pivot"*) or select a category (e.g. *"Brainstorming"*).
3. Type a prompt: *"I need to balance deep technical work with product strategy. How should I structure my week?"*
4. Click Send. Verify Gemini provides a multi-turn response with structured questions.
5. Send a follow-up response. Verify conversation context is maintained across turns.
6. Verify the prompt and response are persisted to Firestore under `users/{uid}/interactions/{id}`.

### Test Case 3: AI Summarization & Sentiment Extraction
1. In the journal editor, click the **"Summarize"** button in the top action bar.
2. Verify Gemini synthesizes a 2-3 sentence executive summary and attaches topic tags (e.g. `#Strategy`, `#Productivity`).
3. Verify the summary appears in the right sidebar and is saved to the document.

### Test Case 4: AI Goal Extraction & Tracker Integration
1. In the journal editor, click **"Extract Goals"**.
2. Verify Gemini detects actionable commitments and displays them with target categories (e.g. Career, Mindset).
3. Click **"Track Goal"** on any extracted item.
4. Navigate to the **"Goals & Actions"** tab from the top navigation.
5. Verify the extracted goal is listed, toggle its completion status, and update the progress slider.

### Test Case 5: Weekly Reflection Synthesis
1. Create 2 or more journal reflections with distinct themes.
2. Navigate to the **"Weekly Synthesis"** tab.
3. Click **"Generate New Synthesis"**.
4. Verify Gemini aggregates past entries and produces celebrated wins, recurring obstacles, and 3 strategic focus priorities for the upcoming week.

### Test Case 6: Full-Text Journal Vault Search & Deletion
1. Navigate to the **"Journal Vault"** tab.
2. Search for a specific keyword in the search bar. Verify dynamic filtering.
3. Filter by category or click on topic tags.
4. Click an entry to reopen the full conversation.
5. Delete an entry using the trash icon and confirm deletion from Firestore.

### Test Case 7: Sign Out & Tenant Isolation
1. Click the Logout icon in the header.
2. Sign in with a different Google account or session.
3. Verify the new user's vault is clean and cannot access the previous user's documents.
