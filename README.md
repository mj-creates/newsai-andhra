# 📰 NewsAI Andhra

An AI-powered regional news summarizer for Andhra Pradesh, India.

## 🔍 What it does
- Select any of the 26 districts of Andhra Pradesh
- Fetches live news from Telugu newspapers (Eenadu, Sakshi, Andhrajyothi)
- Generates an AI summary using Groq LLaMA3
- Interactive map that animates and zooms into the selected district

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Leaflet.js
- **Backend:** Node.js, Express, RSS Parser
- **AI:** Groq API (LLaMA3)
- **News Sources:** Eenadu, Sakshi, Andhrajyothi, Times of India AP

## 🚀 How to run locally

### Frontend
```bash
cd news-ai
npm install
npm run dev
```

### Backend
```bash
cd news-ai-backend
npm install
node index.js
```

### Environment Variables
Create a `.env` file in `news-ai` folder:
VITE_NEWS_API_KEY=your_newsapi_key
VITE_GROQ_API_KEY=your_groq_key


## 👩‍💻 Built by
Manaswini — B.Tech CSE, VFSTR University
