# Social Media Platform

A full-stack modern social media application built with the MERN stack (MongoDB, Express, React, Node.js), featuring real-time interactions, media uploads, and interest-based feeds.

## 🏗️ Project Structure

Below is the exact directory structure of the project as viewed in the file explorer.

### 🌐 Root Directory
```text
SOCIAL MEDIA
├── backend/                # Node.js/Express API server
├── frontend/               # React/Vite client application
├── docker-compose.yml      # Docker services orchestration
├── package.json            # Root configuration
├── README.md               # Project documentation
└── start.sh                # Initialization script
```

---

### 🖥️ Backend Structure (`backend/`)
```text
backend/
├── node_modules/
├── src/
│   ├── config/             # Environment & Database config
│   ├── controllers/        # Business logic
│   ├── middlewares/        # Custom middlewares
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   ├── scripts/            # Utility scripts
│   ├── utils/              # Helper functions
│   ├── validators/         # Input validation
│   ├── app.js              # Express app setup
│   ├── server.js           # Entry point
│   └── socket.js           # WebSocket logic
├── .dockerignore
├── .env
├── .gitignore
├── Dockerfile
├── package-lock.json
├── package.json
└── README.md
```

---

### 🎨 Frontend Structure (`frontend/`)
```text
frontend/
├── dist/                   # Production build
├── node_modules/
├── public/                 # Static assets
├── src/                    # React source code
│   ├── components/         # Reusable UI components
│   ├── constants/          # Static reference data
│   ├── hooks/              # Reusable React logic
│   ├── lib/                # Internal utilities
│   ├── pages/              # Full-page components
│   ├── services/           # API communication layer
│   ├── store/              # Redux state management
│   ├── App.jsx             # Main routing & app entry
│   ├── index.css           # Global styles
│   └── main.jsx            # React entry point
├── .dockerignore
├── .env
├── .gitignore
├── Dockerfile
├── eslint.config.js
├── index.html
├── nginx.conf
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### Fast Start
To start the entire environment:
```bash
npm start
# OR
./start.sh
```
