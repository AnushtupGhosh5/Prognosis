from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import bcrypt
import random
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from firebase_config import init_firebase, get_db, create_custom_token, verify_firebase_token
from functools import wraps

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS for production deployment
CORS(app, origins=[
    "http://localhost:3000",
    "https://prognosisfrontend-ce14p6kjf-anushtup-ghoshs-projects.vercel.app",
    "https://*.vercel.app",  # Allow all Vercel preview deployments
    "https://prognosis-frontend.vercel.app"  # Production domain if different
], supports_credentials=True, methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# Initialize Firebase
db = init_firebase()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Add response headers for cross-origin policies
@app.after_request
def after_request(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    response.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
    return response

def require_auth(f):
    """Decorator to require authentication for protected endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        decoded_token = verify_firebase_token(token)
        if not decoded_token:
            return jsonify({'error': 'Invalid token'}), 401
        
        request.user_uid = decoded_token['uid']
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Check if user already exists
        users_ref = db.collection('users')
        existing_user = users_ref.where('email', '==', email).get()
        
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user document
        user_data = {
            'email': email,
            'password_hash': password_hash.decode('utf-8'),
            'created_at': datetime.utcnow(),
            'sessions': []
        }
        
        # Add user to Firestore
        user_ref = users_ref.add(user_data)[1]
        user_id = user_ref.id
        
        # Create custom token
        custom_token = create_custom_token(user_id)
        if not custom_token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        return jsonify({
            'token': custom_token.decode('utf-8'),
            'user_id': user_id,
            'email': email
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user by email
        users_ref = db.collection('users')
        user_docs = users_ref.where('email', '==', email).get()
        
        if not user_docs:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user_doc = user_docs[0]
        user_data = user_doc.to_dict()
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user_data['password_hash'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create custom token
        custom_token = create_custom_token(user_doc.id)
        if not custom_token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        return jsonify({
            'token': custom_token.decode('utf-8'),
            'user_id': user_doc.id,
            'email': email
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/social', methods=['POST'])
def social_auth():
    """Handle social authentication (Google/GitHub)"""
    try:
        # For social auth, the user is already authenticated via Firebase client
        # We just need to verify the token and create/update user record
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        decoded_token = verify_firebase_token(token)
        if not decoded_token:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_uid = decoded_token['uid']
        email = decoded_token.get('email')
        name = decoded_token.get('name', '')
        
        # Check if user exists in our database
        users_ref = db.collection('users')
        existing_users = users_ref.where('firebase_uid', '==', user_uid).get()
        
        if existing_users:
            # User exists, return existing data
            user_doc = existing_users[0]
            user_data = user_doc.to_dict()
            return jsonify({
                'user_id': user_doc.id,
                'email': user_data.get('email', email),
                'name': user_data.get('name', name)
            }), 200
        else:
            # Create new user record for social auth
            user_data = {
                'firebase_uid': user_uid,
                'email': email,
                'name': name,
                'auth_provider': 'social',
                'created_at': datetime.utcnow(),
                'sessions': []
            }
            
            # Add user to Firestore
            user_ref = users_ref.add(user_data)[1]
            user_id = user_ref.id
            
            return jsonify({
                'user_id': user_id,
                'email': email,
                'name': name
            }), 201
        
    except Exception as e:
        print(f"Social auth error: {e}")
        return jsonify({'error': 'Social authentication failed'}), 500

@app.route('/api/case/start', methods=['GET'])
@require_auth
def start_case():
    """Start a new clinical case simulation"""
    try:
        user_uid = request.user_uid
        
        # Get all available cases
        cases_ref = db.collection('cases')
        cases = cases_ref.get()
        
        if not cases:
            # Create sample cases if none exist
            sample_cases = [
                {
                    'patient_name': 'John Smith',
                    'age': 45,
                    'gender': 'Male',
                    'chief_complaint': 'Chest pain for 2 hours',
                    'vitals': {
                        'blood_pressure': '160/95',
                        'heart_rate': 110,
                        'temperature': 98.6,
                        'respiratory_rate': 22,
                        'oxygen_saturation': 96
                    },
                    'history': 'Patient has a history of hypertension and smoking',
                    'system_instruction': 'You are John Smith, a 45-year-old male presenting with chest pain. You are anxious and worried about having a heart attack. Answer medical student questions as this patient would, describing symptoms of acute coronary syndrome.',
                    'correct_diagnosis': 'Acute Coronary Syndrome',
                    'correct_treatment': 'Aspirin, nitroglycerin, oxygen, morphine, and urgent cardiology consultation'
                },
                {
                    'patient_name': 'Sarah Johnson',
                    'age': 28,
                    'gender': 'Female',
                    'chief_complaint': 'Severe abdominal pain',
                    'vitals': {
                        'blood_pressure': '120/80',
                        'heart_rate': 95,
                        'temperature': 101.2,
                        'respiratory_rate': 18,
                        'oxygen_saturation': 98
                    },
                    'history': 'No significant past medical history',
                    'system_instruction': 'You are Sarah Johnson, a 28-year-old female with severe right lower quadrant abdominal pain. You are experiencing nausea and have had one episode of vomiting. Answer questions as this patient would, describing symptoms of acute appendicitis.',
                    'correct_diagnosis': 'Acute Appendicitis',
                    'correct_treatment': 'IV antibiotics, pain management, and urgent surgical consultation for appendectomy'
                }
            ]
            
            # Add sample cases to database
            for case in sample_cases:
                cases_ref.add(case)
            
            # Refresh cases list
            cases = cases_ref.get()
        
        # Randomly select a case
        case_list = [doc for doc in cases]
        selected_case_doc = random.choice(case_list)
        selected_case = selected_case_doc.to_dict()
        case_id = selected_case_doc.id
        
        # Create new session
        session_data = {
            'user_id': user_uid,
            'case_id': case_id,
            'chat_history': [],
            'status': 'active',
            'started_at': datetime.utcnow(),
            'diagnosis': None,
            'treatment': None,
            'score': None,
            'feedback': None
        }
        
        session_ref = db.collection('sessions').add(session_data)[1]
        session_id = session_ref.id
        
        # Return case details (excluding answers)
        case_response = {
            'session_id': session_id,
            'case_id': case_id,
            'patient_name': selected_case['patient_name'],
            'age': selected_case['age'],
            'gender': selected_case['gender'],
            'chief_complaint': selected_case['chief_complaint'],
            'vitals': selected_case['vitals'],
            'history': selected_case['history']
        }
        
        return jsonify(case_response), 200
        
    except Exception as e:
        print(f"Start case error: {e}")
        return jsonify({'error': 'Failed to start case'}), 500

@app.route('/api/case/respond', methods=['POST'])
@require_auth
def respond_to_case():
    """Handle user input and generate AI response"""
    try:
        user_uid = request.user_uid
        data = request.get_json()
        session_id = data.get('session_id')
        user_input = data.get('user_input')
        
        if not session_id or not user_input:
            return jsonify({'error': 'Session ID and user input required'}), 400
        
        # Get session
        session_ref = db.collection('sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = session_doc.to_dict()
        
        # Verify user owns this session
        if session_data['user_id'] != user_uid:
            return jsonify({'error': 'Unauthorized access to session'}), 403
        
        # Get case details
        case_ref = db.collection('cases').document(session_data['case_id'])
        case_doc = case_ref.get()
        case_data = case_doc.to_dict()
        
        # Build conversation history for context
        chat_history = session_data.get('chat_history', [])
        conversation_context = ""
        for entry in chat_history:
            conversation_context += f"Student: {entry['user_input']}\nPatient: {entry['ai_response']}\n\n"
        
        # Create detailed prompt for Gemini
        prompt = f"""
{case_data['system_instruction']}

Patient Background:
- Name: {case_data['patient_name']}
- Age: {case_data['age']}
- Gender: {case_data['gender']}
- Chief Complaint: {case_data['chief_complaint']}
- Medical History: {case_data['history']}

Conversation so far:
{conversation_context}

New question from medical student: {user_input}

Respond as the patient would, staying in character. Be realistic about symptoms, emotions, and knowledge level. Do not reveal medical diagnoses - let the student figure it out.
"""
        
        # Generate AI response using Gemini
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        ai_response = response.text
        
        # Update chat history
        new_entry = {
            'user_input': user_input,
            'ai_response': ai_response,
            'timestamp': datetime.utcnow()
        }
        
        chat_history.append(new_entry)
        
        # Update session in database
        session_ref.update({'chat_history': chat_history})
        
        return jsonify({'ai_response': ai_response}), 200
        
    except Exception as e:
        print(f"Response error: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500

@app.route('/api/case/submit', methods=['POST'])
@require_auth
def submit_diagnosis():
    """Submit diagnosis and treatment, get feedback"""
    try:
        user_uid = request.user_uid
        data = request.get_json()
        session_id = data.get('session_id')
        diagnosis = data.get('diagnosis')
        treatment = data.get('treatment')
        
        if not session_id or not diagnosis or not treatment:
            return jsonify({'error': 'Session ID, diagnosis, and treatment required'}), 400
        
        # Get session
        session_ref = db.collection('sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = session_doc.to_dict()
        
        # Verify user owns this session
        if session_data['user_id'] != user_uid:
            return jsonify({'error': 'Unauthorized access to session'}), 403
        
        # Get case details
        case_ref = db.collection('cases').document(session_data['case_id'])
        case_doc = case_ref.get()
        case_data = case_doc.to_dict()
        
        # Generate feedback using Gemini
        feedback_prompt = f"""
You are an expert medical educator providing feedback to a medical student.

Case Details:
- Patient: {case_data['patient_name']}, {case_data['age']}-year-old {case_data['gender']}
- Chief Complaint: {case_data['chief_complaint']}
- Correct Diagnosis: {case_data['correct_diagnosis']}
- Correct Treatment: {case_data['correct_treatment']}

Student's Submission:
- Diagnosis: {diagnosis}
- Treatment: {treatment}

Please provide:
1. A score out of 100 based on accuracy of diagnosis and appropriateness of treatment
2. Detailed feedback explaining what the student got right and wrong
3. Educational points to help them improve
4. The correct diagnosis and treatment plan

Format your response as constructive feedback that helps the student learn.
"""
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        feedback_response = model.generate_content(feedback_prompt)
        feedback_text = feedback_response.text
        
        # Calculate simple score based on diagnosis match
        diagnosis_score = 70 if diagnosis.lower() in case_data['correct_diagnosis'].lower() else 30
        treatment_score = 20 if any(word in treatment.lower() for word in case_data['correct_treatment'].lower().split()) else 10
        total_score = min(100, diagnosis_score + treatment_score)
        
        # Update session with submission
        session_ref.update({
            'diagnosis': diagnosis,
            'treatment': treatment,
            'score': total_score,
            'feedback': feedback_text,
            'status': 'completed',
            'completed_at': datetime.utcnow()
        })
        
        return jsonify({
            'score': total_score,
            'feedback': feedback_text,
            'correct_diagnosis': case_data['correct_diagnosis'],
            'correct_treatment': case_data['correct_treatment']
        }), 200
        
    except Exception as e:
        print(f"Submit diagnosis error: {e}")
        return jsonify({'error': 'Failed to submit diagnosis'}), 500

@app.route('/api/sessions', methods=['GET'])
@require_auth
def get_user_sessions():
    """Get user's past sessions"""
    try:
        user_uid = request.user_uid
        
        # Get user's sessions - try with ordering first, fall back to simple query
        sessions_ref = db.collection('sessions')
        
        try:
            # Try to query with ordering (requires composite index)
            sessions = sessions_ref.where('user_id', '==', user_uid).order_by('started_at', direction='DESCENDING').get()
        except Exception as index_error:
            print(f"Composite index not available, using simple query: {index_error}")
            # Fall back to simple query without ordering
            sessions = sessions_ref.where('user_id', '==', user_uid).get()
        
        session_list = []
        for session_doc in sessions:
            try:
                session_data = session_doc.to_dict()
                
                # Get case details
                case_ref = db.collection('cases').document(session_data['case_id'])
                case_doc = case_ref.get()
                
                if not case_doc.exists:
                    print(f"Case not found for session {session_doc.id}")
                    continue
                    
                case_data = case_doc.to_dict()
                
                session_info = {
                    'session_id': session_doc.id,
                    'patient_name': case_data.get('patient_name', 'Unknown Patient'),
                    'chief_complaint': case_data.get('chief_complaint', 'No complaint recorded'),
                    'status': session_data.get('status', 'unknown'),
                    'score': session_data.get('score'),
                    'started_at': session_data.get('started_at'),
                    'completed_at': session_data.get('completed_at')
                }
                session_list.append(session_info)
            except Exception as session_error:
                print(f"Error processing session {session_doc.id}: {session_error}")
                continue
        
        # Sort by started_at in Python if we couldn't sort in Firestore
        try:
            session_list.sort(key=lambda x: x.get('started_at', datetime.min), reverse=True)
        except Exception as sort_error:
            print(f"Could not sort sessions: {sort_error}")
        
        return jsonify({'sessions': session_list}), 200
        
    except Exception as e:
        print(f"Get sessions error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get sessions'}), 500

@app.route('/api/session/<session_id>', methods=['GET'])
@require_auth
def get_session_details(session_id):
    """Get detailed session information"""
    try:
        user_uid = request.user_uid
        
        # Get session
        session_ref = db.collection('sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = session_doc.to_dict()
        
        # Verify user owns this session
        if session_data['user_id'] != user_uid:
            return jsonify({'error': 'Unauthorized access to session'}), 403
        
        # Get case details
        case_ref = db.collection('cases').document(session_data['case_id'])
        case_doc = case_ref.get()
        case_data = case_doc.to_dict()
        
        response_data = {
            'session_id': session_id,
            'case': {
                'patient_name': case_data['patient_name'],
                'age': case_data['age'],
                'gender': case_data['gender'],
                'chief_complaint': case_data['chief_complaint'],
                'vitals': case_data['vitals'],
                'history': case_data['history']
            },
            'chat_history': session_data.get('chat_history', []),
            'status': session_data['status'],
            'diagnosis': session_data.get('diagnosis'),
            'treatment': session_data.get('treatment'),
            'score': session_data.get('score'),
            'feedback': session_data.get('feedback'),
            'started_at': session_data['started_at'],
            'completed_at': session_data.get('completed_at')
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Get session details error: {e}")
        return jsonify({'error': 'Failed to get session details'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Prognosis API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# For Vercel deployment
from flask import Flask
app = app