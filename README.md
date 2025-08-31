# Prognosis MVP - AI-Powered Medical Case Simulation Platform

Prognosis is an innovative AI-powered medical case simulation platform designed for medical students. It provides interactive patient scenarios where students can practice their diagnostic skills through conversational AI, receive real-time feedback, and improve their clinical reasoning abilities.

## 🎯 Features

- **🔐 Secure Authentication**: JWT-based user registration and login system
- **🤖 AI Patient Simulation**: Interactive conversations with AI-powered virtual patients using Google Gemini
- **💬 Real-time Chat Interface**: Natural language conversations with simulated patients
- **📋 Case Management**: Multiple clinical cases with different medical scenarios
- **📊 Intelligent Scoring System**: AI-powered feedback and scoring based on diagnosis accuracy
- **📈 Session History**: Track and review past cases and performance metrics
- **📱 Responsive Design**: Mobile-friendly interface with modern UI/UX

## 🏗️ System Architecture

### High-Level Architecture Overview

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        A[Next.js Frontend<br/>React 19 + Tailwind CSS]
        A1[Authentication UI]
        A2[Chat Interface]
        A3[Dashboard]
        A4[Feedback System]
        A --> A1
        A --> A2
        A --> A3
        A --> A4
    end
    
    subgraph API["⚙️ API Layer"]
        B[Flask Backend<br/>Python REST API]
        B1[Auth Middleware<br/>JWT + Firebase]
        B2[Case Controller]
        B3[Session Controller]
        B4[AI Controller]
        B --> B1
        B --> B2
        B --> B3
        B --> B4
    end
    
    subgraph Data["💾 Data Layer"]
        C[Firebase Firestore<br/>NoSQL Database]
        D[Firebase Auth<br/>User Management]
        C1[(Users Collection)]
        C2[(Cases Collection)]
        C3[(Sessions Collection)]
        C --> C1
        C --> C2
        C --> C3
    end
    
    subgraph AI["🤖 AI Layer"]
        E[Google Gemini API<br/>LLM Integration]
        E1[Patient Simulation]
        E2[Feedback Generation]
        E --> E1
        E --> E2
    end
    
    A -.->|HTTPS/REST| B
    B1 -.->|Token Validation| D
    B2 -.->|Case Data| C
    B3 -.->|Session Storage| C
    B4 -.->|AI Generation| E
    
    style Client fill:#e1f5fe
    style API fill:#f3e5f5
    style Data fill:#e8f5e8
    style AI fill:#fff3e0
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant S as 👨‍🎓 Medical Student
    participant F as 🖥️ Next.js Frontend
    participant B as ⚙️ Flask Backend
    participant FB as 🔥 Firebase
    participant G as 🤖 Gemini AI
    
    Note over S,G: Authentication Flow
    S->>F: Login/Register Request
    F->>B: POST /api/auth/login
    B->>FB: Validate/Create User
    FB-->>B: User Data
    B->>B: Generate Custom Token
    B-->>F: JWT + Custom Token
    F->>FB: signInWithCustomToken
    FB-->>F: Firebase User Session
    F-->>S: Dashboard Access
    
    Note over S,G: Case Simulation Flow
    S->>F: Start New Case
    F->>B: GET /api/case/start
    B->>FB: Query Cases Collection
    FB-->>B: Random Case Data
    B->>FB: Create Session Document
    B-->>F: Case Details + Session ID
    F-->>S: Display Case Information
    
    Note over S,G: Patient Interaction Flow
    loop Patient Conversation
        S->>F: Ask Question to Patient
        F->>B: POST /api/case/respond
        B->>FB: Retrieve Session + Case
        B->>G: Generate Patient Response
        Note right of G: System Instruction:<br/>"Act as patient with<br/>specific symptoms"
        G-->>B: AI Patient Response
        B->>FB: Update Chat History
        B-->>F: Patient Reply
        F-->>S: Display Response
    end
    
    Note over S,G: Diagnosis & Feedback Flow
    S->>F: Submit Diagnosis
    F->>B: POST /api/case/submit
    B->>FB: Retrieve Session Data
    B->>G: Generate Feedback & Score
    Note right of G: "Evaluate diagnosis<br/>against correct answer"
    G-->>B: Detailed Feedback
    B->>FB: Store Final Results
    B-->>F: Score + Feedback
    F-->>S: Display Results
```

### Component Architecture

```mermaid
graph TD
    subgraph Frontend["🖥️ Frontend Architecture"]
        subgraph Pages["📄 Next.js Pages (App Router)"]
            A[🏠 Home Page<br/>app/page.js] 
            B[📊 Dashboard<br/>app/dashboard/page.js]
            C[💬 Simulation<br/>app/simulation/id/page.js]
            D[📝 Feedback<br/>app/feedback/id/page.js]
        end
        
        subgraph Components["🧩 React Components"]
            E[🔐 AuthForm.js<br/>Login/Register]
            F[🗂️ Navbar.js<br/>Navigation]
            G[💬 ChatWindow.js<br/>Real-time Chat]
            H[📋 CaseDetailsPanel.js<br/>Patient Info]
            I[📝 FeedbackModal.js<br/>Diagnosis Form]
        end
        
        subgraph Utils["🛠️ Utilities & Config"]
            J[🔥 Firebase Config<br/>lib/firebase.js]
            K[🌐 API Client<br/>HTTP Requests]
            L[🎨 Tailwind Theme<br/>globals.css]
        end
    end
    
    subgraph Backend["⚙️ Backend Architecture"]
        subgraph Endpoints["🔌 REST API Endpoints"]
            M[POST /api/auth/register<br/>👤 User Registration]
            N[POST /api/auth/login<br/>🔑 User Authentication]
            O[GET /api/case/start<br/>🎯 Start New Case]
            P[POST /api/case/respond<br/>💬 Patient Response]
            Q[POST /api/case/submit<br/>📊 Submit Diagnosis]
            R[GET /api/sessions<br/>📈 Session History]
        end
        
        subgraph Services["🛠️ Core Services"]
            S[🔐 Auth Service<br/>JWT + Firebase]
            T[📋 Case Service<br/>Case Management]
            U[💾 Session Service<br/>Session Handling]
            V[🤖 AI Service<br/>Gemini Integration]
        end
    end
    
    subgraph External["🌐 External Services"]
        W[🔥 Firebase Firestore<br/>Database]
        X[🤖 Google Gemini<br/>AI Language Model]
    end
    
    %% Page to Component connections
    A --> E
    A --> F
    B --> F
    C --> G
    C --> H
    C --> I
    
    %% Component to API connections
    E -.->|Auth Requests| M
    E -.->|Auth Requests| N
    B -.->|Fetch Cases| O
    B -.->|Get History| R
    G -.->|Chat Messages| P
    I -.->|Submit Results| Q
    
    %% Backend service connections
    M --> S
    N --> S
    O --> T
    P --> V
    Q --> V
    R --> U
    
    %% External service connections
    S -.->|User Management| W
    T -.->|Case Data| W
    U -.->|Session Storage| W
    V -.->|AI Generation| X
    
    %% Shared utilities
    A --> J
    B --> J
    C --> J
    D --> J
    
    style Frontend fill:#e3f2fd
    style Backend fill:#f3e5f5
    style External fill:#e8f5e8
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with React 19, Tailwind CSS 4
- **Backend**: Flask (Python) with Flask-CORS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication with custom tokens
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Styling**: Tailwind CSS with custom medical theme
- **Development**: ESLint, PostCSS, Hot reload

## 📁 Project Structure

```
/Prognosis
├── 📁 backend/                 # Flask API Server
│   ├── app.py                  # Main Flask application
│   ├── firebase_config.py      # Firebase Admin SDK setup
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (create from .env.example)
│   ├── .env.example           # Environment template
│   └── service_account.json    # Firebase service account key
├── 📁 frontend/                # Next.js Client Application
│   ├── 📁 app/                 # Next.js App Router (v15)
│   │   ├── layout.js           # Root layout with Tailwind CSS
│   │   ├── page.js             # Home page (authentication)
│   │   ├── globals.css         # Global styles + Tailwind config
│   │   ├── 📁 dashboard/
│   │   │   └── page.js         # User dashboard & session history
│   │   ├── 📁 simulation/id/
│   │   │   └── page.js         # Live case simulation
│   │   └── 📁 feedback/id/
│   │       └── page.js         # Post-simulation feedback
│   ├── 📁 components/          # Reusable React components
│   │   ├── AuthForm.js         # Login/Registration form
│   │   ├── ChatWindow.js       # Real-time chat interface
│   │   ├── CaseDetailsPanel.js # Patient vitals & information
│   │   ├── FeedbackModal.js    # Diagnosis submission modal
│   │   └── Navbar.js           # Navigation bar
│   ├── 📁 lib/                 # Utility libraries
│   │   └── firebase.js         # Firebase client configuration
│   ├── 📁 public/              # Static assets
│   ├── package.json            # Dependencies (Next.js, React, Firebase)
│   ├── next.config.mjs         # Next.js configuration
│   ├── postcss.config.mjs      # PostCSS configuration
│   ├── eslint.config.mjs       # ESLint configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── .env.local              # Frontend environment variables
│   └── .env.local.example      # Frontend environment template
├── 📁 .git/                    # Git repository
├── .gitignore                  # Git ignore patterns
└── README.md                   # Project documentation (this file)
```
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Firebase project
- Google Cloud project with Gemini API access

### Environment Configuration

This project includes example environment files to help you get started:

- **Backend**: `backend/.env.example` → Copy to `backend/.env`
- **Frontend**: `frontend/.env.local.example` → Copy to `frontend/.env.local`

These example files contain all required environment variables with placeholder values. Never commit your actual `.env` files to version control - they're already included in `.gitignore`.

### 1. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download the JSON file

### 2. Google Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini API
3. Save the API key for configuration

### 3. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` file with your actual credentials:
   ```env
   FLASK_ENV=development
   FLASK_DEBUG=True
   
   # Firebase Configuration (from your service account JSON)
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project-id.iam.gserviceaccount.com
   
   # Gemini API Configuration
   GEMINI_API_KEY=your-gemini-api-key
   
   # JWT Secret
   JWT_SECRET_KEY=your-jwt-secret-key
   ```

5. **Replace service_account.json:**
   Replace the contents of `service_account.json` with your Firebase service account key

6. **Run the backend:**
   ```bash
   python app.py
   ```
   The backend will run on `http://localhost:5000`

### 4. Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install additional dependencies** (Firebase and Axios are already installed):
   ```bash
   npm install
   ```
   
   Note: The frontend was created using `npx create-next-app@latest` with Tailwind CSS, ESLint, and App Router enabled.

3. **Configure environment variables:**
   Create `.env.local` file from the example template:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` file with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

4. **Run the frontend:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## Usage

### For Students

1. **Register/Login**: Create an account or log in to access the platform
2. **Start New Case**: Click "Start New Case" on the dashboard to begin a simulation
3. **Patient Interview**: Use the chat interface to ask questions and gather information
4. **Submit Diagnosis**: When ready, submit your diagnosis and treatment plan
5. **Review Feedback**: Receive AI-generated feedback and scoring on your performance

### For Administrators

The system automatically includes sample cases. To add more cases:

1. Access Firestore Console
2. Add documents to the `cases` collection with the following structure:
   ```json
   {
     "patient_name": "Patient Name",
     "age": 25,
     "gender": "Female/Male",
     "chief_complaint": "Primary complaint",
     "vitals": {
       "blood_pressure": "120/80",
       "heart_rate": 75,
       "temperature": 98.6,
       "respiratory_rate": 16,
       "oxygen_saturation": 98
     },
     "history": "Medical history",
     "system_instruction": "Instructions for AI patient behavior",
     "correct_diagnosis": "Correct diagnosis",
     "correct_treatment": "Correct treatment plan"
   }
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Case Management
- `GET /api/case/start` - Start new case simulation
- `POST /api/case/respond` - Send message to AI patient
- `POST /api/case/submit` - Submit diagnosis and treatment

### Session Management
- `GET /api/sessions` - Get user's session history
- `GET /api/session/<id>` - Get specific session details

## Development

### Running in Development Mode

1. **Backend**: Flask runs with debug mode enabled
2. **Frontend**: Next.js runs with hot reload

### Common Issues

1. **CORS Errors**: Ensure Flask-CORS is properly configured
2. **Firebase Connection**: Verify service account key and environment variables
3. **Gemini API**: Check API key and quota limits
4. **Authentication**: Ensure Firebase client configuration matches backend

## Security Considerations

- Never commit real API keys or credentials to version control
- Use environment variables for all sensitive configuration
- Implement proper user authentication and authorization
- Validate all user inputs on the backend
- Use HTTPS in production

## 🐙 GitHub Deployment Preparation

This project is ready for GitHub deployment with the following security measures:

### 🛡️ Environment Security
- **`.gitignore`**: Comprehensive ignore file excluding all sensitive data
- **Environment Templates**: `.env.example` files provided for easy setup
- **No Secrets Committed**: All API keys and credentials use environment variables

### 📁 File Structure for Deployment
```
✅ Safe to commit:
  ├── Source code files (.js, .py, .css)
  ├── Configuration files (next.config.mjs, requirements.txt)
  ├── Documentation (README.md)
  └── Environment templates (.env.example, .env.local.example)

❌ Never committed (in .gitignore):
  ├── Environment files (.env, .env.local)
  ├── Firebase service account (service_account.json)
  ├── Dependencies (node_modules/, __pycache__/)
  └── Build outputs (.next/, dist/)
```

### 🛠️ Setup for Contributors
1. Clone the repository
2. Copy environment examples:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```
3. Fill in your actual API keys and configuration
4. Add your Firebase service account JSON file to `backend/service_account.json`
5. Follow the setup instructions above

## Deployment

### Backend Deployment
- Deploy to platforms like Heroku, Railway, or Google Cloud Run
- Ensure environment variables are configured
- Use production-grade WSGI server (Gunicorn)

### Frontend Deployment
- Deploy to Vercel, Netlify, or similar platforms
- Configure environment variables in deployment settings
- Update API base URL for production backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is developed for educational purposes as part of a medical training platform MVP.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review environment variable configuration
3. Verify API credentials and connectivity
4. Check browser console for client-side errors
5. Review Flask logs for server-side issues