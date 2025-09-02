import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initFirebase, getDb, createCustomToken, verifyFirebaseToken } from '../firebaseConfig.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure CORS for Vercel deployment with dynamic origin checking
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
            "http://localhost:3000",
            "https://prognosisfrontend.vercel.app",
            "https://prognosisbackend.vercel.app",
            "https://prognosisbackend4.vercel.app",
            "https://med-tutor-frontend.vercel.app",
            "https://med-tutor.vercel.app"
        ];
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Check if origin matches Vercel deployment pattern for your projects
        const vercelPatterns = [
            /^https:\/\/prognosisfrontend-[a-z0-9]+-anushtup-ghoshs-projects\.vercel\.app$/,
            /^https:\/\/prognosisbackend-[a-z0-9]+-anushtup-ghoshs-projects\.vercel\.app$/
        ];
        
        const isAllowed = vercelPatterns.some(pattern => pattern.test(origin));
        if (isAllowed) {
            return callback(null, true);
        }
        
        // Log rejected origins for debugging
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Add response headers for cross-origin policies
app.use((req, res, next) => {
    // Set Cross-Origin-Opener-Policy to unsafe-none for OAuth compatibility
    res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// Initialize Firebase
const db = initFirebase();

// Configure Gemini API
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Authentication middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    verifyFirebaseToken(token)
        .then(decodedToken => {
            if (!decodedToken) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            req.userUid = decodedToken.uid;
            next();
        })
        .catch(error => {
            console.error('Token verification error:', error);
            return res.status(401).json({ error: 'Invalid token' });
        });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is running',
        cors_origins: corsOptions.origin
    });
});

// CORS test endpoint
app.all('/api/cors-test', (req, res) => {
    res.json({
        method: req.method,
        origin: req.headers.origin,
        message: 'CORS test successful'
    });
});

// Handle preflight requests for all API routes
app.options('/api/*', (req, res) => {
    res.status(200).end();
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Check if user already exists
        const usersRef = db.collection('users');
        const existingUserQuery = await usersRef.where('email', '==', email).get();
        
        if (!existingUserQuery.empty) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user document
        const userData = {
            email: email,
            password_hash: passwordHash,
            created_at: new Date(),
            sessions: []
        };
        
        // Add user to Firestore
        const userRef = await usersRef.add(userData);
        const userId = userRef.id;
        
        // Create custom token
        const customToken = await createCustomToken(userId);
        if (!customToken) {
            return res.status(500).json({ error: 'Failed to create authentication token' });
        }
        
        res.status(201).json({
            token: customToken,
            user_id: userId,
            email: email
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Find user by email
        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('email', '==', email).get();
        
        if (userQuery.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, userData.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create custom token
        const customToken = await createCustomToken(userDoc.id);
        if (!customToken) {
            return res.status(500).json({ error: 'Failed to create authentication token' });
        }
        
        res.json({
            token: customToken,
            user_id: userDoc.id,
            email: email
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/social', async (req, res) => {
    try {
        // For social auth, the user is already authenticated via Firebase client
        // We just need to verify the token and create/update user record
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' });
        }
        
        const token = authHeader.split(' ')[1];
        const decodedToken = await verifyFirebaseToken(token);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        const userUid = decodedToken.uid;
        const email = decodedToken.email;
        const name = decodedToken.name || '';
        
        // Check if user exists in our database
        const usersRef = db.collection('users');
        const existingUsersQuery = await usersRef.where('firebase_uid', '==', userUid).get();
        
        if (!existingUsersQuery.empty) {
            // User exists, return existing data
            const userDoc = existingUsersQuery.docs[0];
            const userData = userDoc.data();
            return res.json({
                user_id: userDoc.id,
                email: userData.email || email,
                name: userData.name || name
            });
        } else {
            // Create new user record for social auth
            const userData = {
                firebase_uid: userUid,
                email: email,
                name: name,
                auth_provider: 'social',
                created_at: new Date(),
                sessions: []
            };
            
            // Add user to Firestore
            const userRef = await usersRef.add(userData);
            const userId = userRef.id;
            
            return res.status(201).json({
                user_id: userId,
                email: email,
                name: name
            });
        }
        
    } catch (error) {
        console.error('Social auth error:', error);
        res.status(500).json({ error: 'Social authentication failed' });
    }
});

// Case management endpoints
app.get('/api/case/start', requireAuth, async (req, res) => {
    try {
        const userUid = req.userUid;
        
        // Get user's completed cases (only count completed sessions)
        const userSessionsRef = db.collection('sessions');
        const userSessions = await userSessionsRef.where('user_id', '==', userUid).get();
        const attemptedCaseIds = [];
        userSessions.forEach(session => {
            const sessionData = session.data();
            // Count any session (active, completed, etc.) as "attempted" to avoid repeats
            if (sessionData.case_id) {
                attemptedCaseIds.push(sessionData.case_id);
            }
        });
        
        console.log('User attempted case IDs:', attemptedCaseIds);
        
        // Get all available cases
        const casesRef = db.collection('cases');
        const casesSnapshot = await casesRef.get();
        
        let casesArray = [];
        casesSnapshot.forEach(doc => {
            casesArray.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('All available cases:', casesArray.map(c => ({ id: c.id, name: c.patient_name })));
        
        if (casesArray.length < 11) {
            // Create sample cases if we don't have all 11 cases
            console.log(`Only ${casesArray.length} cases found, creating all sample cases...`);
            
            // Delete existing cases first to avoid duplicates
            const batch = db.batch();
            casesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            const sampleCases = [
  {
    patient_name: 'John Smith',
    age: 45,
    gender: 'Male',
    chief_complaint: 'Chest pain for 2 hours',
    vitals: {
      blood_pressure: '160/95',
      heart_rate: 110,
      temperature: 98.6,
      respiratory_rate: 22,
      oxygen_saturation: 96
    },
    history: 'Patient has a history of hypertension and smoking',
    system_instruction: 'You are John Smith, a 45-year-old male presenting with chest pain. You are anxious and worried about having a heart attack. Answer medical student questions as this patient would, describing symptoms of acute coronary syndrome.',
    correct_diagnosis: 'Acute Coronary Syndrome',
    correct_treatment: 'Aspirin, nitroglycerin, oxygen, morphine, and urgent cardiology consultation'
  },
  {
    patient_name: 'Sarah Johnson',
    age: 28,
    gender: 'Female',
    chief_complaint: 'Severe abdominal pain',
    vitals: {
      blood_pressure: '120/80',
      heart_rate: 95,
      temperature: 101.2,
      respiratory_rate: 18,
      oxygen_saturation: 98
    },
    history: 'No significant past medical history',
    system_instruction: 'You are Sarah Johnson, a 28-year-old female with severe right lower quadrant abdominal pain. You are experiencing nausea and have had one episode of vomiting. Answer questions as this patient would, describing symptoms of acute appendicitis.',
    correct_diagnosis: 'Acute Appendicitis',
    correct_treatment: 'IV antibiotics, pain management, and urgent surgical consultation for appendectomy'
  },
  {
    patient_name: 'Robert Davis',
    age: 68,
    gender: 'Male',
    chief_complaint: 'Sudden onset of left-sided weakness and difficulty speaking',
    vitals: {
      blood_pressure: '190/110',
      heart_rate: 85,
      temperature: 99.0,
      respiratory_rate: 16,
      oxygen_saturation: 97
    },
    history: 'Patient has a history of atrial fibrillation and high cholesterol',
    system_instruction: 'You are Robert Davis, a 68-year-old male. You suddenly experienced weakness in your left arm and leg and now have trouble forming words. You are confused and slightly disoriented. Answer medical student questions as this patient would, describing symptoms of a stroke.',
    correct_diagnosis: 'Ischemic Stroke',
    correct_treatment: 'Immediate neurological assessment, CT scan of the head, consideration for thrombolytic therapy (tPA) or mechanical thrombectomy, and supportive care'
  },
  {
    patient_name: 'Maria Garcia',
    age: 35,
    gender: 'Female',
    chief_complaint: 'Shortness of breath and cough',
    vitals: {
      blood_pressure: '115/75',
      heart_rate: 105,
      temperature: 102.5,
      respiratory_rate: 24,
      oxygen_saturation: 93
    },
    history: 'Patient has a history of asthma and recently traveled internationally',
    system_instruction: 'You are Maria Garcia, a 35-year-old female. You have been experiencing a persistent cough and shortness of breath for the past three days. You feel feverish and fatigued. Answer medical student questions as this patient would, describing symptoms of a lower respiratory tract infection.',
    correct_diagnosis: 'Community-Acquired Pneumonia',
    correct_treatment: 'Prescribe appropriate antibiotics (e.g., azithromycin or doxycycline), supportive care with fluids and rest, and follow-up in 2-3 days'
  },
  {
    patient_name: 'David Thompson',
    age: 60,
    gender: 'Male',
    chief_complaint: 'Severe tearing chest and back pain',
    vitals: {
      blood_pressure: '190/100',
      heart_rate: 95,
      temperature: 98.7,
      respiratory_rate: 20,
      oxygen_saturation: 97
    },
    history: 'History of uncontrolled hypertension, smoker',
    system_instruction: 'You are David Thompson, a 60-year-old male with sudden, severe chest pain radiating to the back. You describe it as tearing. Answer questions showing features of aortic dissection.',
    correct_diagnosis: 'Aortic Dissection',
    correct_treatment: 'Immediate blood pressure control with IV beta-blockers, pain control, vascular surgery consultation'
  },
  {
    patient_name: 'Emily Chen',
    age: 24,
    gender: 'Female',
    chief_complaint: 'Fever, painful urination, and flank pain',
    vitals: {
      blood_pressure: '110/70',
      heart_rate: 105,
      temperature: 102.8,
      respiratory_rate: 18,
      oxygen_saturation: 99
    },
    history: 'Sexually active, no significant PMH',
    system_instruction: 'You are Emily Chen, a 24-year-old female with burning urination, fever, and right-sided flank pain. Answer questions showing features of acute pyelonephritis.',
    correct_diagnosis: 'Acute Pyelonephritis',
    correct_treatment: 'IV or oral antibiotics (e.g., ceftriaxone or ciprofloxacin), fluids, and pain management'
  },
  {
    patient_name: 'Michael Brown',
    age: 72,
    gender: 'Male',
    chief_complaint: 'Shortness of breath, swollen legs',
    vitals: {
      blood_pressure: '150/90',
      heart_rate: 110,
      temperature: 98.4,
      respiratory_rate: 24,
      oxygen_saturation: 90
    },
    history: 'History of heart failure, on diuretics',
    system_instruction: 'You are Michael Brown, a 72-year-old male with worsening shortness of breath, orthopnea, and leg swelling. Answer questions as a patient with acute decompensated heart failure.',
    correct_diagnosis: 'Acute Decompensated Heart Failure',
    correct_treatment: 'Supplemental oxygen, IV diuretics (furosemide), monitor electrolytes, cardiology follow-up'
  },
  {
    patient_name: 'Olivia Martinez',
    age: 50,
    gender: 'Female',
    chief_complaint: 'Persistent fatigue and weight gain',
    vitals: {
      blood_pressure: '118/76',
      heart_rate: 58,
      temperature: 96.8,
      respiratory_rate: 16,
      oxygen_saturation: 98
    },
    history: 'No significant history, family history of thyroid disease',
    system_instruction: 'You are Olivia Martinez, a 50-year-old female with chronic fatigue, constipation, cold intolerance, and weight gain. Answer questions consistent with hypothyroidism.',
    correct_diagnosis: 'Hypothyroidism',
    correct_treatment: 'Thyroid function tests, start levothyroxine replacement, monitor TSH levels'
  },
  {
    patient_name: 'James Wilson',
    age: 30,
    gender: 'Male',
    chief_complaint: 'Confusion and sweating after skipping a meal',
    vitals: {
      blood_pressure: '110/70',
      heart_rate: 120,
      temperature: 98.6,
      respiratory_rate: 18,
      oxygen_saturation: 99
    },
    history: 'Type 1 diabetes mellitus on insulin',
    system_instruction: 'You are James Wilson, a 30-year-old male with diabetes who became confused and sweaty after missing lunch. You are irritable and shaky. Answer questions consistent with hypoglycemia.',
    correct_diagnosis: 'Hypoglycemia',
    correct_treatment: 'Immediate oral glucose if conscious, IV dextrose or IM glucagon if altered consciousness'
  },
  {
    patient_name: 'Sophia Patel',
    age: 22,
    gender: 'Female',
    chief_complaint: 'Severe headache and neck stiffness',
    vitals: {
      blood_pressure: '110/65',
      heart_rate: 102,
      temperature: 103.1,
      respiratory_rate: 20,
      oxygen_saturation: 97
    },
    history: 'No major medical history, lives in college dorms',
    system_instruction: 'You are Sophia Patel, a 22-year-old female with sudden headache, fever, and neck stiffness. You are photophobic and nauseous. Answer questions as a patient with meningitis.',
    correct_diagnosis: 'Bacterial Meningitis',
    correct_treatment: 'Immediate empiric IV antibiotics (e.g., ceftriaxone + vancomycin), dexamethasone, lumbar puncture after ruling out raised ICP'
  },
  {
    patient_name: 'William Johnson',
    age: 40,
    gender: 'Male',
    chief_complaint: 'Hallucinations and tremors after stopping alcohol',
    vitals: {
      blood_pressure: '145/95',
      heart_rate: 120,
      temperature: 100.2,
      respiratory_rate: 22,
      oxygen_saturation: 97
    },
    history: 'Chronic heavy alcohol use, stopped drinking 2 days ago',
    system_instruction: 'You are William Johnson, a 40-year-old male with tremors, sweating, anxiety, and visual hallucinations after stopping alcohol. Answer questions showing alcohol withdrawal delirium (delirium tremens).',
    correct_diagnosis: 'Alcohol Withdrawal Delirium (Delirium Tremens)',
    correct_treatment: 'Benzodiazepines (e.g., diazepam or lorazepam), IV fluids, thiamine supplementation, electrolyte correction'
  }
];

            for (const caseData of sampleCases) {
                const caseWithType = { ...caseData, case_type: 'predefined' };
                await casesRef.add(caseWithType);
            }
            
            // Refresh cases list
            const updatedCasesSnapshot = await casesRef.get();
            casesArray = [];
            updatedCasesSnapshot.forEach(doc => {
                casesArray.push({ id: doc.id, ...doc.data() });
            });
        }
        
        // Filter out cases the user has already attempted
        const availableCases = casesArray.filter(caseItem => !attemptedCaseIds.includes(caseItem.id));
        
        console.log('Available cases after filtering:', availableCases.map(c => ({ id: c.id, name: c.patient_name })));
        console.log('Total available cases:', availableCases.length);
        
        let selectedCase;
        
        if (availableCases.length > 0) {
            // Select a random case from available cases
            selectedCase = availableCases[Math.floor(Math.random() * availableCases.length)];
        } else {
            // All predefined cases completed, generate a new case using AI
            selectedCase = await generateNewCase();
            // Save the generated case to database
            const newCaseRef = await casesRef.add(selectedCase);
            selectedCase.id = newCaseRef.id;
        }
        
        const caseId = selectedCase.id;
        
        // Create new session
        const sessionData = {
            user_id: userUid,
            case_id: caseId,
            chat_history: [],
            status: 'active',
            started_at: new Date(),
            diagnosis: null,
            treatment: null,
            score: null,
            feedback: null
        };
        
        const sessionRef = await db.collection('sessions').add(sessionData);
        const sessionId = sessionRef.id;
        
        // Return case details (excluding answers)
        const caseResponse = {
            session_id: sessionId,
            case_id: caseId,
            patient_name: selectedCase.patient_name,
            age: selectedCase.age,
            gender: selectedCase.gender,
            chief_complaint: selectedCase.chief_complaint,
            vitals: selectedCase.vitals,
            history: selectedCase.history,
            case_type: selectedCase.case_type || 'predefined'
        };
        
        res.json(caseResponse);
        
    } catch (error) {
        console.error('Start case error:', error);
        res.status(500).json({ error: 'Failed to start case' });
    }
});

app.post('/api/case/respond', requireAuth, async (req, res) => {
    try {
        const userUid = req.userUid;
        const { session_id, user_input } = req.body;
        
        if (!session_id || !user_input) {
            return res.status(400).json({ error: 'Session ID and user input required' });
        }
        
        // Get session
        const sessionRef = db.collection('sessions').doc(session_id);
        const sessionDoc = await sessionRef.get();
        
        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const sessionData = sessionDoc.data();
        
        // Verify user owns this session
        if (sessionData.user_id !== userUid) {
            return res.status(403).json({ error: 'Unauthorized access to session' });
        }
        
        // Get case details
        const caseRef = db.collection('cases').doc(sessionData.case_id);
        const caseDoc = await caseRef.get();
        const caseData = caseDoc.data();
        
        // Build conversation history for context
        const chatHistory = sessionData.chat_history || [];
        let conversationContext = "";
        for (const entry of chatHistory) {
            conversationContext += `Student: ${entry.user_input}\nPatient: ${entry.ai_response}\n\n`;
        }
        
        // Create detailed prompt for Gemini
        const prompt = `
${caseData.system_instruction}

Patient Background:
- Name: ${caseData.patient_name}
- Age: ${caseData.age}
- Gender: ${caseData.gender}
- Chief Complaint: ${caseData.chief_complaint}
- Medical History: ${caseData.history}

Conversation so far:
${conversationContext}

New question from medical student: ${user_input}

Respond as the patient would, staying in character. Be realistic about symptoms, emotions, and knowledge level. Do not reveal medical diagnoses - let the student figure it out.
`;
        
        // Generate AI response using Gemini
        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        
        // Update chat history
        const newEntry = {
            user_input: user_input,
            ai_response: aiResponse,
            timestamp: new Date()
        };
        
        chatHistory.push(newEntry);
        
        // Update session in database
        await sessionRef.update({ chat_history: chatHistory });
        
        res.json({ ai_response: aiResponse });
        
    } catch (error) {
        console.error('Response error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.post('/api/case/submit', requireAuth, async (req, res) => {
    try {
        const userUid = req.userUid;
        const { session_id, diagnosis, treatment } = req.body;
        
        if (!session_id || !diagnosis || !treatment) {
            return res.status(400).json({ error: 'Session ID, diagnosis, and treatment required' });
        }
        
        // Get session
        const sessionRef = db.collection('sessions').doc(session_id);
        const sessionDoc = await sessionRef.get();
        
        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const sessionData = sessionDoc.data();
        
        // Verify user owns this session
        if (sessionData.user_id !== userUid) {
            return res.status(403).json({ error: 'Unauthorized access to session' });
        }
        
        // Get case details
        const caseRef = db.collection('cases').doc(sessionData.case_id);
        const caseDoc = await caseRef.get();
        const caseData = caseDoc.data();
        
        // Generate feedback using Gemini
        const feedbackPrompt = `
You are an expert medical educator providing feedback to a medical student.

Case Details:
- Patient: ${caseData.patient_name}, ${caseData.age}-year-old ${caseData.gender}
- Chief Complaint: ${caseData.chief_complaint}
- Correct Diagnosis: ${caseData.correct_diagnosis}
- Correct Treatment: ${caseData.correct_treatment}

Student's Submission:
- Diagnosis: ${diagnosis}
- Treatment: ${treatment}

Please provide:
1. A score out of 100 based on accuracy of diagnosis and appropriateness of treatment
2. Detailed feedback explaining what the student got right and wrong
3. Educational points to help them improve
4. The correct diagnosis and treatment plan

Format your response as constructive feedback that helps the student learn.
`;
        
        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const feedbackResult = await model.generateContent(feedbackPrompt);
        const feedbackText = feedbackResult.response.text();
        
        // Calculate simple score based on diagnosis match
        const diagnosisScore = diagnosis.toLowerCase().includes(caseData.correct_diagnosis.toLowerCase()) ? 70 : 30;
        const treatmentWords = caseData.correct_treatment.toLowerCase().split(' ');
        const treatmentScore = treatmentWords.some(word => treatment.toLowerCase().includes(word)) ? 20 : 10;
        const totalScore = Math.min(100, diagnosisScore + treatmentScore);
        
        // Update session with submission
        await sessionRef.update({
            diagnosis: diagnosis,
            treatment: treatment,
            score: totalScore,
            feedback: feedbackText,
            status: 'completed',
            completed_at: new Date()
        });
        
        res.json({
            score: totalScore,
            feedback: feedbackText,
            correct_diagnosis: caseData.correct_diagnosis,
            correct_treatment: caseData.correct_treatment
        });
        
    } catch (error) {
        console.error('Submit diagnosis error:', error);
        res.status(500).json({ error: 'Failed to submit diagnosis' });
    }
});

// Session management endpoints
app.get('/api/sessions', requireAuth, async (req, res) => {
    try {
        const userUid = req.userUid;
        
        // Get user's sessions
        const sessionsRef = db.collection('sessions');
        
        let sessionsQuery;
        try {
            // Try to query with ordering (requires composite index)
            sessionsQuery = await sessionsRef
                .where('user_id', '==', userUid)
                .orderBy('started_at', 'desc')
                .get();
        } catch (indexError) {
            console.log(`Composite index not available, using simple query: ${indexError}`);
            // Fall back to simple query without ordering
            sessionsQuery = await sessionsRef
                .where('user_id', '==', userUid)
                .get();
        }
        
        const sessionList = [];
        for (const sessionDoc of sessionsQuery.docs) {
            try {
                const sessionData = sessionDoc.data();
                
                // Get case details
                const caseRef = db.collection('cases').doc(sessionData.case_id);
                const caseDoc = await caseRef.get();
                
                if (!caseDoc.exists) {
                    console.log(`Case not found for session ${sessionDoc.id}`);
                    continue;
                }
                
                const caseData = caseDoc.data();
                
                const sessionInfo = {
                    session_id: sessionDoc.id,
                    patient_name: caseData.patient_name || 'Unknown Patient',
                    chief_complaint: caseData.chief_complaint || 'No complaint recorded',
                    status: sessionData.status || 'unknown',
                    score: sessionData.score,
                    started_at: sessionData.started_at,
                    completed_at: sessionData.completed_at
                };
                sessionList.push(sessionInfo);
            } catch (sessionError) {
                console.error(`Error processing session ${sessionDoc.id}:`, sessionError);
                continue;
            }
        }
        
        // Sort by started_at in JavaScript if we couldn't sort in Firestore
        try {
            sessionList.sort((a, b) => {
                const dateA = a.started_at ? new Date(a.started_at.seconds * 1000) : new Date(0);
                const dateB = b.started_at ? new Date(b.started_at.seconds * 1000) : new Date(0);
                return dateB - dateA;
            });
        } catch (sortError) {
            console.log(`Could not sort sessions: ${sortError}`);
        }
        
        res.json({ sessions: sessionList });
        
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});

app.get('/api/session/:sessionId', requireAuth, async (req, res) => {
    try {
        const userUid = req.userUid;
        const sessionId = req.params.sessionId;
        
        // Get session
        const sessionRef = db.collection('sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        
        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const sessionData = sessionDoc.data();
        
        // Verify user owns this session
        if (sessionData.user_id !== userUid) {
            return res.status(403).json({ error: 'Unauthorized access to session' });
        }
        
        // Get case details
        const caseRef = db.collection('cases').doc(sessionData.case_id);
        const caseDoc = await caseRef.get();
        const caseData = caseDoc.data();
        
        const responseData = {
            session_id: sessionId,
            case: {
                patient_name: caseData.patient_name,
                age: caseData.age,
                gender: caseData.gender,
                chief_complaint: caseData.chief_complaint,
                vitals: caseData.vitals,
                history: caseData.history
            },
            chat_history: sessionData.chat_history || [],
            status: sessionData.status,
            diagnosis: sessionData.diagnosis,
            treatment: sessionData.treatment,
            score: sessionData.score,
            feedback: sessionData.feedback,
            started_at: sessionData.started_at,
            completed_at: sessionData.completed_at
        };
        
        res.json(responseData);
        
    } catch (error) {
        console.error('Get session details error:', error);
        res.status(500).json({ error: 'Failed to get session details' });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Prognosis API is running',
        version: '1.0.0',
        cors_enabled: true
    });
});

// Debug endpoint
app.get('/debug', (req, res) => {
    res.json({
        path: req.path,
        url: req.url,
        method: req.method,
        origin: req.headers.origin,
        userAgent: req.headers['user-agent'],
        headers: req.headers,
        query: req.query
    });
});

// Debug endpoint to reset cases (remove this in production)
app.post('/api/debug/reset-cases', requireAuth, async (req, res) => {
    try {
        // Delete all existing cases
        const casesRef = db.collection('cases');
        const casesSnapshot = await casesRef.get();
        
        const batch = db.batch();
        casesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        res.json({ message: 'All cases deleted. They will be recreated on next case start.' });
    } catch (error) {
        console.error('Reset cases error:', error);
        res.status(500).json({ error: 'Failed to reset cases' });
    }
});

export default app;

// Helper function to generate new cases using AI
async function generateNewCase() {
    try {
        const prompt = `
Generate a realistic medical case for training purposes. Create a unique scenario that is different from common cases like heart attack, appendicitis, stroke, asthma, subarachnoid hemorrhage, pneumonia, aortic dissection, pyelonephritis, heart failure, hypothyroidism, hypoglycemia, meningitis, or alcohol withdrawal.

Provide the following details in JSON format:
{
  "patient_name": "[First and Last name]",
  "age": [age between 20-80],
  "gender": "[Male/Female]",
  "chief_complaint": "[Main symptom/complaint]",
  "vitals": {
    "blood_pressure": "[systolic/diastolic]",
    "heart_rate": [number],
    "temperature": [number],
    "respiratory_rate": [number],
    "oxygen_saturation": [number]
  },
  "history": "[Relevant medical history]",
  "system_instruction": "[Instructions for AI to roleplay as this patient]",
  "correct_diagnosis": "[Correct medical diagnosis]",
  "correct_treatment": "[Appropriate treatment plan]",
  "case_type": "ai_generated"
}

Make it challenging but realistic for medical students to diagnose. Focus on conditions like: pulmonary embolism, diabetic ketoacidosis, anaphylaxis, acute kidney injury, sepsis, pancreatitis, bowel obstruction, gallbladder disease, or other less common but important conditions.
`;
        
        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const generatedCase = JSON.parse(jsonMatch[0]);
            return generatedCase;
        } else {
            throw new Error('Failed to parse generated case');
        }
    } catch (error) {
        console.error('Error generating new case:', error);
        // Return a fallback case if generation fails
        return {
            patient_name: 'Generated Patient',
            age: 45,
            gender: 'Male',
            chief_complaint: 'General malaise',
            vitals: {
                blood_pressure: '120/80',
                heart_rate: 80,
                temperature: 98.6,
                respiratory_rate: 16,
                oxygen_saturation: 98
            },
            history: 'No significant medical history',
            system_instruction: 'You are a patient with general symptoms. Answer questions about feeling unwell.',
            correct_diagnosis: 'Further evaluation needed',
            correct_treatment: 'Comprehensive history and physical examination',
            case_type: 'ai_generated'
        };
    }
}