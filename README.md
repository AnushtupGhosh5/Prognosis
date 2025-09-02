# Prognosis MVP - AI-Powered Medical Case Simulation Platform

Prognosis is an innovative AI-powered medical case simulation platform designed for medical students. It provides interactive patient scenarios where students can practice their diagnostic skills through conversational AI, receive real-time feedback, and improve their clinical reasoning abilities.

## 🎯 Features

- **🔐 Secure Authentication**: JWT-based user registration and login system
- **🤖 AI Patient Simulation**: Interactive conversations with AI-powered virtual patients using Google Gemini
- **💬 Real-time Chat Interface**: Natural language conversations with simulated patients
- **🎤 Voice Typing Support**: Built-in speech-to-text for hands-free diagnostic input
- **📋 Case Management**: Multiple clinical cases with different medical scenarios stored in structured JSON format
- **🏥 Medical Imaging Integration**: X-rays, CT scans, MRI, ECG, and ultrasound results for enhanced diagnostics
- **📊 Intelligent Scoring System**: AI-powered feedback and scoring based on diagnosis accuracy
- **🏆 Leaderboard & Rankings**: Competitive scoring system with user performance tracking
- **👤 User Profiles**: Detailed statistics, achievements, and performance analytics
- **📈 Session History**: Track and review past cases and performance metrics
- **📱 Responsive Design**: Mobile-friendly interface with modern UI/UX

## 🏗️ System Architecture

### High-Level Architecture Overview

```mermaid
flowchart TD
    A["Next.js Frontend<br/>React 19 + Tailwind CSS"] --> B["Node.js Backend<br/>Express REST API"]
    B --> C["Firebase Firestore<br/>NoSQL Database"]
    B --> D["Firebase Auth<br/>User Management"]
    B --> E["Google Gemini API<br/>AI Integration"]
    B --> F["Medical Cases JSON<br/>Structured Case Data"]
    
    A -.-> A1["Authentication UI"]
    A -.-> A2["Voice-Enabled Chat"]
    A -.-> A3["Interactive Dashboard"]
    A -.-> A4["Medical Imaging Viewer"]
    A -.-> A5["Leaderboard & Analytics"]
    
    B -.-> B1["Auth Middleware"]
    B -.-> B2["Case Controller"]
    B -.-> B3["Session Controller"]
    B -.-> B4["AI Controller"]
    B -.-> B5["Leaderboard API"]
    
    C -.-> C1["Users Collection"]
    C -.-> C2["Cases Collection"]
    C -.-> C3["Sessions Collection"]
    
    E -.-> E1["Patient Simulation"]
    E -.-> E2["Feedback Generation"]
    
    F -.-> F1["11 Predefined Cases"]
    F -.-> F2["Medical Imaging Data"]
    F -.-> F3["AI Case Generation"]
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant S as Student
    participant F as Frontend
    participant B as Backend
    participant FB as Firebase
    participant G as Gemini
    
    Note right of S: Authentication Flow
    S->>F: Login Request
    F->>B: POST /api/auth/login
    B->>FB: Validate User
    FB-->>B: User Data
    B-->>F: JWT Token
    F-->>S: Dashboard Access
    
    Note right of S: Case Simulation Flow
    S->>F: Start New Case
    F->>B: GET /api/case/start
    B->>FB: Query Cases
    FB-->>B: Case Data
    B-->>F: Case Details
    F-->>S: Display Case
    
    Note right of S: Patient Interaction
    S->>F: Ask Question
    F->>B: POST /api/case/respond
    B->>G: Generate Response
    G-->>B: Patient Reply
    B-->>F: Response
    F-->>S: Display Reply
    
    Note right of S: Diagnosis Submission
    S->>F: Submit Diagnosis
    F->>B: POST /api/case/submit
    B->>G: Generate Feedback
    G-->>B: Score and Feedback
    B->>FB: Store Results
    B-->>F: Final Results
    F-->>S: Show Feedback
```

### Component Architecture

```mermaid
flowchart TD
    subgraph "Frontend Pages"
        A["Home Page<br/>app/page.js"]
        B["Dashboard<br/>app/dashboard/page.js"]
        C["Simulation<br/>app/simulation/id/page.js"]
        D["Feedback<br/>app/feedback/id/page.js"]
    end
    
    subgraph "React Components"
        E["AuthForm.js"]
        F["Navbar.js"]
        G["ChatWindow.js"]
        H["CaseDetailsPanel.js"]
        I["FeedbackModal.js"]
    end
    
    subgraph "API Endpoints"
        M["POST /api/auth/register"]
        N["POST /api/auth/login"]
        O["GET /api/case/start"]
        P["POST /api/case/respond"]
        Q["POST /api/case/submit"]
        R["GET /api/sessions"]
    end
    
    subgraph "Backend Services"
        S["Auth Service"]
        T["Case Service"]
        U["Session Service"]
        V["AI Service"]
    end
    
    subgraph "External Services"
        W["Firebase Firestore"]
        X["Google Gemini API"]
    end
    
    A --> E
    A --> F
    B --> F
    C --> G
    C --> H
    C --> I
    
    E --> M
    E --> N
    B --> O
    B --> R
    G --> P
    I --> Q
    
    M --> S
    N --> S
    O --> T
    P --> V
    Q --> V
    R --> U
    
    S --> W
    T --> W
    U --> W
    V --> X
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with React 19, Tailwind CSS 4
- **Backend**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication with custom tokens
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Voice Input**: Web Speech API (browser-native)
- **Case Data**: Structured JSON files with medical imaging
- **Styling**: Tailwind CSS with custom medical theme
- **Development**: ESLint, PostCSS, Hot reload

## 📁 Project Structure

```
/Prognosis
├── 📁 backend/                 # Node.js Express API Server
│   ├── index.js                # Main Express application
│   ├── api/index.js            # Alternative API entry point
│   ├── 📁 data/
│   │   └── medical-cases.json  # Structured case data with imaging
│   ├── firebaseConfig.js       # Firebase Admin SDK setup
│   ├── package.json            # Node.js dependencies
│   ├── .env                    # Environment variables (create from .env.example)
│   └── .env.example           # Environment template
├── 📁 frontend/                # Next.js Client Application
│   ├── 📁 app/                 # Next.js App Router (v15)
│   │   ├── layout.js           # Root layout with Tailwind CSS
│   │   ├── page.js             # Home page (authentication)
│   │   ├── globals.css         # Global styles + Tailwind 4 theme config
│   │   ├── 📁 dashboard/
│   │   │   └── page.js         # User dashboard & session history
│   │   ├── 📁 leaderboard/
│   │   │   └── page.js         # Rankings and leaderboard
│   │   ├── 📁 profile/
│   │   │   └── page.js         # User profile and statistics
│   │   ├── 📁 simulation/id/
│   │   │   └── page.js         # Live case simulation
│   │   └── 📁 feedback/id/
│   │       └── page.js         # Post-simulation feedback
│   ├── 📁 components/          # Reusable React components
│   │   ├── AuthForm.js         # Login/Registration form
│   │   ├── ChatWindow.js       # Voice-enabled chat interface
│   │   ├── CaseDetailsPanel.js # Patient vitals & medical imaging
│   │   ├── FeedbackModal.js    # Voice-enabled diagnosis submission
│   │   ├── VoiceInput.js       # Speech-to-text component
│   │   ├── Leaderboard.js      # Rankings and competition
│   │   ├── UserProfile.js      # Detailed user statistics
│   │   └── Navbar.js           # Navigation bar
│   ├── 📁 lib/                 # Utility libraries
│   │   └── firebase.js         # Firebase client configuration
│   ├── 📁 public/              # Static assets
│   ├── package.json            # Dependencies (Next.js, React, Firebase)
│   ├── jsconfig.json           # JavaScript configuration
│   ├── next.config.mjs         # Next.js configuration
│   ├── postcss.config.mjs      # PostCSS configuration
│   ├── eslint.config.mjs       # ESLint configuration
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
   - **Voice Input**: Click the microphone icon to use speech-to-text for hands-free typing
   - **Medical Imaging**: Review X-rays, CT scans, MRI, ECG, and ultrasound results in the case details panel
4. **Submit Diagnosis**: When ready, submit your diagnosis and treatment plan
   - **Voice Typing**: Use voice input for diagnosis and treatment fields
5. **Review Feedback**: Receive AI-generated feedback and scoring on your performance
6. **Track Progress**: View your statistics, rankings, and achievements on the leaderboard and profile pages

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

### 🚀 Vercel Deployment (Recommended for Frontend)

This project is optimized for Vercel deployment with the following features:

**Deployment Files Included:**
- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- `deploy.sh` - Automated deployment script
- Root `package.json` - Project recognition

**Steps for Vercel Deployment:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project root:**
   ```bash
   vercel
   ```

4. **For production deployment:**
   ```bash
   vercel --prod
   ```

**Environment Variables for Vercel:**
In your Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

**Build Configuration:**
- ESLint errors are ignored during build (`ignoreDuringBuilds: true`)
- TypeScript errors are ignored during build (`ignoreBuildErrors: true`)
- Optimized for production performance

### Backend Deployment

**Recommended Platforms:**
- **Railway**: Easy Python deployment with automatic HTTPS
- **Heroku**: Classic platform with extensive documentation
- **Google Cloud Run**: Serverless container deployment
- **DigitalOcean App Platform**: Simple and cost-effective

**Environment Variables for Backend:**
```bash
FLASK_ENV=production
FLASK_DEBUG=False
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your_gemini_key
JWT_SECRET_KEY=your_jwt_secret
```

**For Railway Deployment:**
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on push to main branch

### Alternative Deployment Options

**Netlify (Frontend):**
- Build command: `cd frontend && npm run build`
- Publish directory: `frontend/.next`
- Framework: Next.js

**Docker Deployment:**
Created a `Dockerfile` and `docker-compose.yml` for containerized deployment.

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase project setup complete
- [ ] Gemini API key active
- [ ] Backend deployed and accessible
- [ ] Frontend deployed with correct API URL
- [ ] CORS configured for frontend domain
- [ ] Database rules set for production
- [ ] SSL certificates active (HTTPS)

### Troubleshooting Deployment

**Common Issues:**
1. **Build Failures**: Check ESLint and TypeScript configurations
2. **Environment Variables**: Ensure all required vars are set
3. **API Connection**: Verify backend URL and CORS settings
4. **Firebase**: Check service account permissions
5. **Gemini API**: Verify quota and API key validity

**Debug Commands:**
```bash
# Test build locally
cd frontend && npm run build

# Check ESLint
npm run lint

# Verify environment
echo $NEXT_PUBLIC_API_BASE_URL
```

## 🆕 New Features in Latest Version

### 🎤 Voice Typing Integration

**Component**: `VoiceInput.js`
- **Browser Support**: Uses Web Speech API (Chrome, Edge, Safari)
- **Functionality**: 
  - Real-time speech-to-text conversion
  - Visual feedback with animated microphone icon
  - Error handling for unsupported browsers
  - Seamless integration with text inputs

**Usage**:
- Available in chat window for patient questions
- Integrated in diagnosis and treatment submission forms
- Click microphone icon to start/stop voice input
- Spoken text automatically appends to existing content

### 🏥 Medical Imaging System

**Data Structure**: Enhanced case data with imaging information
- **X-ray Results**: Chest X-rays with detailed findings
- **CT Scans**: Head, chest, and abdominal CT imaging
- **MRI Scans**: Brain MRI with contrast findings
- **ECG/EKG**: 12-lead electrocardiogram results
- **Ultrasound**: Renal, thyroid, and abdominal ultrasound
- **Echocardiogram**: Cardiac function assessment

**Features**:
- Expandable imaging sections in case details panel
- Detailed findings for each imaging modality
- Integration with clinical reasoning process
- Realistic medical imaging descriptions

### 📄 Structured Case Data Management

**File**: `backend/data/medical-cases.json`
- **11 Comprehensive Cases**: From acute coronary syndrome to bacterial meningitis
- **Medical Imaging Data**: Each case includes relevant imaging studies
- **Structured Format**: Consistent JSON schema for easy maintenance
- **Expandable**: Easy to add new cases without code changes

**Case Categories**:
- Cardiovascular: ACS, Heart Failure, Aortic Dissection
- Neurological: Stroke, Meningitis, Hypoglycemia
- Respiratory: Pneumonia, Respiratory Failure
- Gastrointestinal: Appendicitis, Bowel Obstruction
- Infectious: UTI, Sepsis, Withdrawal Syndromes
- Endocrine: Hypothyroidism, Diabetic Emergencies

### 🏆 Leaderboard & User Analytics

**Components**: `Leaderboard.js`, `UserProfile.js`
- **Competitive Rankings**: Real-time scoring and ranking system
- **Performance Metrics**: Average scores, completion rates, streaks
- **Achievement System**: Badges and milestones for progression
- **Detailed Analytics**: Session history, improvement tracking

**Features**:
- Global leaderboard with top performers
- Individual performance dashboards
- Progress tracking over time
- Comparative analytics and insights

### 🚪 Backend Modernization

**Migration**: Flask → Node.js/Express
- **Performance**: Improved response times and scalability
- **Maintenance**: Unified JavaScript ecosystem
- **Features**: Enhanced error handling and logging
- **API**: RESTful endpoints with comprehensive documentation

**New Endpoints**:
- `GET /api/leaderboard` - Rankings and statistics
- `GET /api/profile/:userId?` - User profiles and analytics
- Enhanced case management with imaging data

### 📱 Enhanced User Experience

**Responsive Design Improvements**:
- Voice input accessibility on mobile devices
- Touch-friendly medical imaging viewers
- Optimized leaderboard layout for all screen sizes
- Improved navigation with profile and ranking pages

**Accessibility Features**:
- Screen reader support for voice input components
- Keyboard navigation for all interactive elements
- High contrast medical imaging displays
- Alternative text for visual elements

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