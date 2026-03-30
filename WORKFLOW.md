# Hackathon Monitor - Workflow Documentation

## System Overview

The system monitors hackathon participants by analyzing screenshots from Electron apps in real-time.

## Workflow Steps

### 1. Screenshot Ingestion (Every 30 seconds)
- Electron app sends screenshot to `POST /api/ingest`
- Payload includes: userId, teamId, timestamp, base64 image, countCycle
- Screenshot is queued for processing

### 2. Immediate Analysis (Real-time)
- **Model**: `meta-llama/llama-4-scout-17b-16e-instruct` (Scout model)
- Analyzes what the developer is doing
- Detects AI dependency (only flags if AI is building the entire project)
- Returns: description, aiDependencyFlag, confidence
- **Saved to DB immediately** → Shows up in monitor page instantly

### 3. Batch Processing (Every 3 minutes = 6 screenshots)
After collecting 6 screenshots (3 minutes at 30-second intervals):

#### Model 1: GPT-OSS-120B
- **Model**: `openai/gpt-oss-120b`
- Summarizes 3-minute activity
- Scores progress (0-100)
- Evaluates AI dependency

#### Model 2: Llama-3.3-70B
- **Model**: `llama-3.3-70b-versatile`
- Independent summary and scoring
- Cross-validates GPT results

#### Final Output
- Mean score = (GPT score + Llama score) / 2
- Combined AI dependency detection
- Saved to `team_progress` table

## Monitor Dashboard Features

### Real-time Section
- Shows individual screenshot analyses as they arrive
- Updates every 5 seconds
- Displays: member name, timestamp, description, confidence, AI flags

### Batch Summary Section
- Shows 3-minute summaries
- Displays: time range, GPT/Llama/Mean scores
- Color-coded scores (green=excellent, red=poor)
- AI dependency warnings

## Database Schema

### `image_analyses` (Individual screenshots)
- Saved immediately after Scout analysis
- Shows real-time activity

### `team_progress` (Batch summaries)
- Saved after 6 screenshots
- Contains GPT + Llama summaries and scores

## Testing the Workflow

1. Start the server: `npm run dev`
2. Create a team at `/admin`
3. Create a member for that team
4. Run test: `node test-workflow.js`
5. View results at `/monitor`

## API Endpoints

- `POST /api/ingest` - Receive screenshots
- `GET /api/status` - Queue status
- `GET /api/monitor/analyses?teamId=X` - Real-time analyses
- `GET /api/monitor/progress` - Batch summaries
- `GET /api/admin/teams` - Team management
- `GET /api/admin/members` - Member management

## Environment Variables

```
GROQ_API_KEY=your_key
DATABASE_URL=postgresql://...
GROQ_SCOUT_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_GPT_MODEL=openai/gpt-oss-120b
GROQ_LLAMA_MODEL=llama-3.3-70b-versatile
```

## Key Features

✅ Real-time screenshot analysis
✅ Immediate DB storage for instant visibility
✅ Dual-model batch summarization (GPT-120B + Llama-70B)
✅ Mean score calculation
✅ AI dependency detection
✅ Live dashboard with auto-refresh
✅ Color-coded progress indicators
