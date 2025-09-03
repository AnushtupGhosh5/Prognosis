import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initFirebase, getDb, createCustomToken, verifyFirebaseToken } from '../firebaseConfig.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load medical cases from JSON file
const medicalCasesPath = join(__dirname, '..', 'data', 'medical-cases.json');
const medicalCasesData = JSON.parse(readFileSync(medicalCasesPath, 'utf8'));

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
            "http://127.0.0.1:3000",
            "http://localhost:5000",
            "http://127.0.0.1:5000",
            "https://prognosisfrontend.vercel.app",
            "https://prognosisbackend.vercel.app",
            "https://prognosisbackend4.vercel.app",
            "https://med-tutor-frontend.vercel.app",
            "https://med-tutor.vercel.app",
            "https://prognosis.anushtup.com",
            // New explicit productions
            "https://prognosis2.vercel.app"
        ];
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Check if origin matches Vercel deployment pattern for your projects
        const vercelPatterns = [
            // Existing preview domains for old projects
            /^https:\/\/prognosisfrontend-[a-z0-9]+-anushtup-ghoshs-projects\.vercel\.app$/,
            /^https:\/\/prognosisbackend-[a-z0-9]+-anushtup-ghoshs-projects\.vercel\.app$/,
            // Allow previews for prognosisbackend and prognosis2 (e.g., prognosisbackend-<hash>.vercel.app)
            /^https:\/\/prognosisbackend(?:-[a-z0-9-]+)?\.vercel\.app$/,
            /^https:\/\/prognosis2(?:-[a-z0-9-]+)?\.vercel\.app$/
        ];
        
        const isAllowed = vercelPatterns.some(pattern => pattern.test(origin));
        if (isAllowed) {
            return callback(null, true);
        }
        
        // Check if origin matches prognosis.anushtup.com subdomains
        const prognosisPatterns = [
            /^https:\/\/.*\.prognosis\.anushtup\.com$/
        ];
        
        const isPrognosisSubdomain = prognosisPatterns.some(pattern => pattern.test(origin));
        if (isPrognosisSubdomain) {
            return callback(null, true);
        }
        
        // Log rejected origins for debugging
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    // Allow default header reflection; avoid strict header list to prevent preflight failures
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
app.options('*', cors(corsOptions));

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
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
            // Optional display name for email signups
            ...(name ? { name } : {}),
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
            email: email,
            name: name || null
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
            email: email,
            name: userData.name || null
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
        const photoURL = decodedToken.picture || null;
        
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
                name: userData.name || name,
                photoURL: userData.photoURL || photoURL
            });
        } else {
            // Create new user record for social auth
            const userData = {
                firebase_uid: userUid,
                email: email,
                name: name,
                photoURL: photoURL,
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
                name: name,
                photoURL: photoURL
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
            
            const sampleCases = medicalCasesData.predefinedCases;

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
            medical_imaging: selectedCase.medical_imaging || null,
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
                history: caseData.history,
                medical_imaging: caseData.medical_imaging || null
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

// Leaderboard endpoints
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { limit = 50, timeframe = 'all' } = req.query;
        
        // Get all users
        const usersRef = db.collection('users');
        const usersSnapshot = await usersRef.get();
        
        if (usersSnapshot.empty) {
            return res.json({ leaderboard: [] });
        }
        
        const leaderboardData = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            // Get user's sessions
            const sessionsRef = db.collection('sessions');
            let sessionsQuery = sessionsRef
                .where('user_id', '==', userDoc.id)
                .where('status', '==', 'completed');
            
            // Apply timeframe filter if needed
            if (timeframe !== 'all') {
                const now = new Date();
                let startDate = new Date();
                
                switch (timeframe) {
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    case 'year':
                        startDate.setFullYear(now.getFullYear() - 1);
                        break;
                }
                
                sessionsQuery = sessionsQuery.where('completed_at', '>=', startDate);
            }
            
            const sessionsSnapshot = await sessionsQuery.get();
            
            if (sessionsSnapshot.empty) {
                continue;
            }
            
            // Calculate user statistics
            let totalScore = 0;
            let totalSessions = 0;
            let perfectScores = 0;
            let totalTime = 0;
            
            sessionsSnapshot.forEach(sessionDoc => {
                const sessionData = sessionDoc.data();
                if (sessionData.score !== null && sessionData.score !== undefined) {
                    totalScore += sessionData.score;
                    totalSessions++;
                    
                    if (sessionData.score === 100) {
                        perfectScores++;
                    }
                    
                    // Calculate session duration if timestamps are available
                    if (sessionData.started_at && sessionData.completed_at) {
                        const startTime = sessionData.started_at.toDate ? sessionData.started_at.toDate() : new Date(sessionData.started_at);
                        const endTime = sessionData.completed_at.toDate ? sessionData.completed_at.toDate() : new Date(sessionData.completed_at);
                        totalTime += (endTime - startTime) / 1000 / 60; // minutes
                    }
                }
            });
            
            if (totalSessions > 0) {
                const averageScore = Math.round(totalScore / totalSessions);
                const averageTime = totalTime > 0 ? Math.round(totalTime / totalSessions) : 0;
                
                leaderboardData.push({
                    user_id: userDoc.id,
                    name: userData.name || userData.email || 'Anonymous',
                    email: userData.email,
                    photoURL: userData.photoURL || null,
                    averageScore: averageScore,
                    totalSessions: totalSessions,
                    perfectScores: perfectScores,
                    averageTime: averageTime,
                    // Calculate ranking score (weighted average)
                    rankingScore: Math.round((averageScore * 0.7) + (totalSessions * 0.2) + (perfectScores * 0.1))
                });
            }
        }
        
        // Sort by ranking score (highest first)
        leaderboardData.sort((a, b) => {
            if (b.rankingScore === a.rankingScore) {
                // Tie-breaker: higher average score
                if (b.averageScore === a.averageScore) {
                    // Secondary tie-breaker: more sessions
                    return b.totalSessions - a.totalSessions;
                }
                return b.averageScore - a.averageScore;
            }
            return b.rankingScore - a.rankingScore;
        });
        
        // Add rank positions
        leaderboardData.forEach((user, index) => {
            user.rank = index + 1;
        });
        
        // Apply limit
        const limitedData = leaderboardData.slice(0, parseInt(limit));
        
        res.json({ 
            leaderboard: limitedData,
            totalUsers: leaderboardData.length,
            timeframe: timeframe
        });
        
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// User profile endpoints
app.get('/api/profile/:userId?', requireAuth, async (req, res) => {
    try {
        const targetUserId = req.params.userId || req.userUid;
        
        // Get user data
        let userDoc;
        if (req.params.userId) {
            // Looking up another user by ID
            const usersRef = db.collection('users');
            const userSnapshot = await usersRef.doc(targetUserId).get();
            if (!userSnapshot.exists) {
                return res.status(404).json({ error: 'User not found' });
            }
            userDoc = { id: userSnapshot.id, ...userSnapshot.data() };
        } else {
            // Looking up current user by UID
            const usersRef = db.collection('users');
            const userQuery = await usersRef.where('firebase_uid', '==', targetUserId).get();
            if (userQuery.empty) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userSnapshot = userQuery.docs[0];
            userDoc = { id: userSnapshot.id, ...userSnapshot.data() };
        }
        
        // Get user's sessions
        const sessionsRef = db.collection('sessions');
        const sessionsSnapshot = await sessionsRef.where('user_id', '==', userDoc.id).get();
        
        // Calculate comprehensive statistics
        const stats = {
            totalSessions: 0,
            completedSessions: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 100,
            perfectScores: 0,
            totalScore: 0,
            averageTime: 0,
            fastestTime: null,
            longestTime: 0,
            recentSessions: [],
            scoreHistory: [],
            casesCompleted: [],
            streakCurrent: 0,
            streakLongest: 0
        };
        
        let totalTime = 0;
        const sessionTimes = [];
        const completedSessions = [];
        
        sessionsSnapshot.forEach(sessionDoc => {
            const sessionData = sessionDoc.data();
            stats.totalSessions++;
            
            if (sessionData.status === 'completed' && sessionData.score !== null && sessionData.score !== undefined) {
                stats.completedSessions++;
                const score = sessionData.score;
                
                stats.totalScore += score;
                stats.highestScore = Math.max(stats.highestScore, score);
                stats.lowestScore = Math.min(stats.lowestScore, score);
                
                if (score === 100) {
                    stats.perfectScores++;
                }
                
                // Session duration calculation
                if (sessionData.started_at && sessionData.completed_at) {
                    const startTime = sessionData.started_at.toDate ? sessionData.started_at.toDate() : new Date(sessionData.started_at);
                    const endTime = sessionData.completed_at.toDate ? sessionData.completed_at.toDate() : new Date(sessionData.completed_at);
                    const duration = (endTime - startTime) / 1000 / 60; // minutes
                    
                    sessionTimes.push(duration);
                    totalTime += duration;
                    
                    stats.fastestTime = stats.fastestTime === null ? duration : Math.min(stats.fastestTime, duration);
                    stats.longestTime = Math.max(stats.longestTime, duration);
                }
                
                completedSessions.push({
                    id: sessionDoc.id,
                    score: score,
                    completed_at: sessionData.completed_at,
                    case_id: sessionData.case_id
                });
                
                stats.scoreHistory.push({
                    score: score,
                    date: sessionData.completed_at
                });
                
                if (sessionData.case_id && !stats.casesCompleted.includes(sessionData.case_id)) {
                    stats.casesCompleted.push(sessionData.case_id);
                }
            }
        });
        
        // Calculate averages
        if (stats.completedSessions > 0) {
            stats.averageScore = Math.round(stats.totalScore / stats.completedSessions);
            if (sessionTimes.length > 0) {
                stats.averageTime = Math.round(totalTime / sessionTimes.length);
                stats.fastestTime = Math.round(stats.fastestTime);
                stats.longestTime = Math.round(stats.longestTime);
            }
        } else {
            stats.lowestScore = 0;
        }
        
        // Sort sessions by date (most recent first) for recent sessions
        completedSessions.sort((a, b) => {
            const dateA = a.completed_at?.toDate ? a.completed_at.toDate() : new Date(a.completed_at);
            const dateB = b.completed_at?.toDate ? b.completed_at.toDate() : new Date(b.completed_at);
            return dateB - dateA;
        });
        stats.recentSessions = completedSessions.slice(0, 10);
        
        // Sort score history by date
        stats.scoreHistory.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateA - dateB;
        });
        
        // Calculate current and longest streaks
        if (completedSessions.length > 0) {
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;
            
            // Sort by date for streak calculation
            const sortedSessions = [...completedSessions].sort((a, b) => {
                const dateA = a.completed_at?.toDate ? a.completed_at.toDate() : new Date(a.completed_at);
                const dateB = b.completed_at?.toDate ? b.completed_at.toDate() : new Date(b.completed_at);
                return dateA - dateB;
            });
            
            for (let i = 0; i < sortedSessions.length; i++) {
                if (sortedSessions[i].score >= 70) { // Consider 70+ as successful
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 0;
                }
            }
            
            // Calculate current streak from the end
            for (let i = sortedSessions.length - 1; i >= 0; i--) {
                if (sortedSessions[i].score >= 70) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            
            stats.streakCurrent = currentStreak;
            stats.streakLongest = longestStreak;
        }
        
        // Get user's rank in leaderboard
        let userRank = null;
        try {
            const leaderboardResponse = await fetch(`${req.protocol}://${req.get('host')}/api/leaderboard?limit=1000`);
            if (leaderboardResponse.ok) {
                const leaderboardData = await leaderboardResponse.json();
                const userEntry = leaderboardData.leaderboard.find(entry => entry.user_id === userDoc.id);
                if (userEntry) {
                    userRank = userEntry.rank;
                }
            }
        } catch (error) {
            console.log('Could not fetch user rank:', error);
        }
        
        // Prepare response
        const profileData = {
            user: {
                id: userDoc.id,
                name: userDoc.name || userDoc.email || 'Anonymous',
                email: userDoc.email,
                photoURL: userDoc.photoURL || null,
                created_at: userDoc.created_at,
                rank: userRank
            },
            statistics: stats
        };
        
        res.json(profileData);
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
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

// User profile endpoint
app.get('/api/profile/:userId?', requireAuth, async (req, res) => {
    try {
        // Use provided userId or fall back to authenticated user
        const targetUserId = req.params.userId || req.userUid;
        
        // Get user document - first check if targetUserId is a document ID or firebase_uid
        let userDoc;
        let userData;
        
        try {
            // Try as document ID first
            const userDocRef = await db.collection('users').doc(targetUserId).get();
            if (userDocRef.exists) {
                userData = userDocRef.data();
                userDoc = { id: userDocRef.id, ...userData };
            } else {
                // Try as firebase_uid
                const userQuery = await db.collection('users').where('firebase_uid', '==', targetUserId).get();
                if (!userQuery.empty) {
                    const userSnapshot = userQuery.docs[0];
                    userData = userSnapshot.data();
                    userDoc = { id: userSnapshot.id, ...userData };
                } else {
                    return res.status(404).json({ error: 'User not found' });
                }
            }
        } catch (error) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's sessions from sessions collection
        const sessionsRef = db.collection('sessions');
        const sessionsSnapshot = await sessionsRef
            .where('user_id', '==', userDoc.id)
            .where('status', '==', 'completed')
            .get();
        
        if (sessionsSnapshot.empty) {
            return res.json({
                user: {
                    id: userDoc.id,
                    username: userData.username || userData.name || userData.email?.split('@')[0] || userData.displayName || 'Anonymous',
                    email: userData.email,
                    photoURL: userData.photoURL,
                    joined: userData.created_at
                },
                statistics: {
                    totalSessions: 0,
                    averageScore: 0,
                    bestScore: 0,
                    totalScore: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    improvementRate: 0,
                    categoryBreakdown: {},
                    recentPerformance: []
                },
                achievements: [],
                recentActivity: []
            });
        }
        
        // Process sessions data
        const sessions = [];
        sessionsSnapshot.forEach(sessionDoc => {
            const sessionData = sessionDoc.data();
            if (sessionData.score !== null && sessionData.score !== undefined) {
                sessions.push({
                    score: sessionData.score,
                    completed_at: sessionData.completed_at,
                    case_type: sessionData.case_type || 'general',
                    patient_name: sessionData.patient_name || 'Unknown Patient',
                    diagnosis: sessionData.diagnosis || 'Not recorded'
                });
            }
        });
        
        // Calculate comprehensive statistics
        const totalSessions = sessions.length;
        const scores = sessions.map(s => s.score);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const averageScore = totalScore / totalSessions;
        const bestScore = Math.max(...scores);
        
        // Calculate streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        const sortedSessions = sessions
            .sort((a, b) => {
                const dateA = a.completed_at && a.completed_at.toDate ? a.completed_at.toDate() : new Date(a.completed_at);
                const dateB = b.completed_at && b.completed_at.toDate ? b.completed_at.toDate() : new Date(b.completed_at);
                return dateA - dateB;
            });
        
        // Calculate longest streak
        for (const session of sortedSessions) {
            if (session.score >= 70) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        
        // Calculate current streak (from most recent)
        const recentSessions = [...sortedSessions].reverse();
        for (const session of recentSessions) {
            if (session.score >= 70) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // Calculate improvement rate (compare first half vs second half)
        let improvementRate = 0;
        if (totalSessions >= 4) {
            const midPoint = Math.floor(totalSessions / 2);
            const firstHalf = scores.slice(0, midPoint);
            const secondHalf = scores.slice(midPoint);
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            improvementRate = ((secondAvg - firstAvg) / firstAvg) * 100;
        }
        
        // Category breakdown
        const categoryBreakdown = {};
        sessions.forEach(session => {
            const category = session.case_type || 'general';
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = { count: 0, averageScore: 0, totalScore: 0 };
            }
            categoryBreakdown[category].count++;
            categoryBreakdown[category].totalScore += session.score;
            categoryBreakdown[category].averageScore = 
                categoryBreakdown[category].totalScore / categoryBreakdown[category].count;
        });
        
        // Recent performance (last 10 sessions)
        const recentPerformance = sortedSessions
            .slice(-10)
            .map(session => ({
                date: session.completed_at,
                score: session.score,
                case_type: session.case_type
            }));
        
        // Calculate achievements
        const achievements = [];
        
        if (totalSessions >= 1) achievements.push({ id: 'first_case', name: 'First Case', description: 'Completed your first medical case' });
        if (totalSessions >= 10) achievements.push({ id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Completed 10 medical cases' });
        if (totalSessions >= 50) achievements.push({ id: 'case_master', name: 'Case Master', description: 'Completed 50 medical cases' });
        if (bestScore >= 90) achievements.push({ id: 'perfectionist', name: 'Perfectionist', description: 'Achieved a score of 90% or higher' });
        if (currentStreak >= 5) achievements.push({ id: 'on_fire', name: 'On Fire!', description: 'Current streak of 5+ successful cases' });
        if (longestStreak >= 10) achievements.push({ id: 'unstoppable', name: 'Unstoppable', description: 'Achieved a 10+ case streak' });
        if (averageScore >= 80) achievements.push({ id: 'expert_diagnostician', name: 'Expert Diagnostician', description: 'Maintained an 80%+ average score' });
        
        // Recent activity (last 5 sessions with more details)
        const recentActivity = sortedSessions
            .slice(-5)
            .reverse()
            .map(session => ({
                date: session.completed_at,
                score: session.score,
                case_type: session.case_type,
                patient_name: session.patient_name,
                diagnosis: session.diagnosis
            }));
        
        res.json({
            user: {
                id: userDoc.id,
                username: userData.username || userData.name || userData.email?.split('@')[0] || userData.displayName || 'Anonymous',
                email: userData.email,
                photoURL: userData.photoURL,
                joined: userData.created_at
            },
            statistics: {
                totalSessions,
                averageScore: Math.round(averageScore * 10) / 10,
                bestScore,
                totalScore,
                currentStreak,
                longestStreak,
                improvementRate: Math.round(improvementRate * 10) / 10,
                categoryBreakdown,
                recentPerformance
            },
            achievements,
            recentActivity
        });
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Update user's display name
app.post('/api/profile/name', requireAuth, async (req, res) => {
    try {
        const { name } = req.body || {};
        const trimmed = (name || '').trim();
        if (!trimmed || trimmed.length < 2 || trimmed.length > 60) {
            return res.status(400).json({ error: 'Name must be 2-60 characters' });
        }

        // Try by document ID (email/password users)
        let userDocRef = db.collection('users').doc(req.userUid);
        let doc = await userDocRef.get();
        if (!doc.exists) {
            // Fallback to social users where we stored firebase_uid
            const q = await db.collection('users').where('firebase_uid', '==', req.userUid).get();
            if (q.empty) {
                return res.status(404).json({ error: 'User not found' });
            }
            userDocRef = q.docs[0].ref;
            doc = q.docs[0];
        }

        await userDocRef.update({ name: trimmed });
        return res.json({ success: true, name: trimmed, user_id: userDocRef.id });
    } catch (error) {
        console.error('Update name error:', error);
        res.status(500).json({ error: 'Failed to update name' });
    }
});
