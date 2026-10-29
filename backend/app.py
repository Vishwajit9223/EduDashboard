"""
AI Smart Scholarship and Exam Manager - Flask Backend
Main application entry point
"""

import os
import sqlite3
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database models and configuration
from models.db_models import db
from config import config_by_name

# Import API routes
from routes.auth_routes import auth_bp
from routes.recommendation_routes import recommendation_bp
from routes.chatbot_routes import chatbot_bp
from routes.data_routes import data_bp
from routes.users_routes import users_bp


def _ensure_database():
    """Ensure database directory and file exist"""
    db_path = Path(__file__).parent / "database" / "database.db"
    db_dir = db_path.parent
    
    # Create directory if it doesn't exist
    db_dir.mkdir(parents=True, exist_ok=True)
    
    # Create empty database file if it doesn't exist
    if not db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            conn.close()
        except Exception as e:
            print(f"Warning: Could not pre-create database file: {e}")


def create_app(config_name='development'):
    """
    Application factory for creating Flask app with configuration

    Args:
        config_name (str): Configuration environment (development, production, testing)

    Returns:
        Flask: Configured Flask application instance
    """

    # Ensure database is ready
    _ensure_database()

    # Create Flask app
    app = Flask(__name__)

    # Load configuration
    config_class = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(config_class)

    # Initialize database
    db.init_app(app)

    # ── CORS ─────────────────────────────────────────────────
    # flask-cors handles preflight OPTIONS automatically.
    # Single authoritative config — no manual headers anywhere.
    # flask-cors handles preflight OPTIONS automatically.
    # Regex patterns cover any port on localhost / LAN IPs.
    _cors_origins = [
        r"http://localhost(:\d+)?",
        r"http://127\.0\.0\.1(:\d+)?",
        r"http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?",
        r"http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?",
    ]

    CORS(
        app,
        resources={r"/api/*": {"origins": _cors_origins}},
        supports_credentials=True,
    )
    print(f"[CORS] Initialized — allowed origin patterns: {_cors_origins}")

    @app.after_request
    def _log_cors(response):
        origin = request.headers.get("Origin", "")
        acao = response.headers.get("Access-Control-Allow-Origin", "")
        if origin:
            print(f"[CORS] {request.method} {request.path}  origin={origin}  allowed={'✓' if acao else '✗'}")
        return response

    # ── Blueprints ───────────────────────────────────────────
    app.register_blueprint(auth_bp)          # /api/auth
    app.register_blueprint(recommendation_bp)  # /api/recommend
    app.register_blueprint(chatbot_bp)       # /api/chat
    app.register_blueprint(data_bp)          # /api/exams, /api/scholarships
    app.register_blueprint(users_bp)         # /api/users
    print("[ROUTES] Registered: /api/auth, /api/recommend, /api/chat, /api/exams, /api/scholarships, /api/users")

    # ── Health check ─────────────────────────────────────────
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'success': True,
            'message': 'Backend API is running',
            'version': '1.0.0'
        }), 200

    # ── Root ─────────────────────────────────────────────────
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'success': True,
            'message': 'AI Smart Scholarship and Exam Manager',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth/*',
                'recommendations': '/api/recommend/*',
                'chatbot': '/api/chat/*'
            }
        }), 200

    # ── Error handlers ───────────────────────────────────────
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

    # ── Database init ────────────────────────────────────────
    with app.app_context():
        try:
            db.create_all()
            print("[DB] Tables created successfully")

            # Safe migration: add missing columns (SQLite ALTER TABLE)
            _migrate_add_portal_type()
            _migrate_add_user_columns()

            _seed_initial_data()
        except Exception as e:
            print(f"[DB ERROR] {e}")
            print(f"[DB URI]   {app.config['SQLALCHEMY_DATABASE_URI']}")
            raise

    return app


def _migrate_add_portal_type():
    """Add portal_type column to scholarships table if it doesn't exist (SQLite safe)."""
    import sqlite3 as _sqlite3
    from flask import current_app

    uri = current_app.config['SQLALCHEMY_DATABASE_URI']
    # Only applies to SQLite databases
    if 'sqlite' not in uri:
        return

    db_path = uri.replace('sqlite:///', '')
    try:
        conn = _sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(scholarships)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'portal_type' not in columns:
            cursor.execute("ALTER TABLE scholarships ADD COLUMN portal_type VARCHAR(50)")
            conn.commit()
            print("[MIGRATE] Added portal_type column to scholarships table")
        else:
            print("[MIGRATE] portal_type column already exists — skipping")
        conn.close()
    except Exception as e:
        print(f"[MIGRATE WARNING] Could not migrate portal_type: {e}")


def _migrate_add_user_columns():
    """Add missing columns to users table if they don't exist (SQLite safe)."""
    import sqlite3 as _sqlite3
    from flask import current_app

    uri = current_app.config['SQLALCHEMY_DATABASE_URI']
    # Only applies to SQLite databases
    if 'sqlite' not in uri:
        return

    db_path = uri.replace('sqlite:///', '')
    try:
        conn = _sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add phone column if missing
        if 'phone' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20)")
            conn.commit()
            print("[MIGRATE] Added phone column to users table")
        else:
            print("[MIGRATE] phone column already exists — skipping")
        
        # Add is_admin column if missing
        if 'is_admin' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            conn.commit()
            print("[MIGRATE] Added is_admin column to users table")
        else:
            print("[MIGRATE] is_admin column already exists — skipping")
        
        conn.close()
    except Exception as e:
        print(f"[MIGRATE WARNING] Could not migrate users table: {e}")


def _seed_initial_data():
    """Seed initial exams and scholarships into database"""
    from models.db_models import Scholarship, Exam
    from datetime import datetime

    # ── SEED EXAMS (16) ──────────────────────────────────────
    if Exam.query.first() is None:
        exams = [
            # Engineering (4)
            Exam(name='JEE Main', description='National engineering entrance exam (Session 1: Jan 2026, Session 2: Apr 2026)',
                 exam_type='Engineering', max_score=300, passing_marks=90,
                 exam_date=datetime(2026, 1, 25), application_deadline=datetime(2025, 12, 15),
                 duration_minutes=180, total_questions=90,
                 min_age=17, max_age=25, required_education='12th', required_stream='Science',
                 min_percentage=75, max_attempts=3,
                 career_field='Engineering', difficulty_level='Hard', mode='Online', fee=650,
                 website='https://jeemain.nta.ac.in', is_active=True),
            Exam(name='JEE Advanced', description='Top engineering entrance exam for IIT admissions',
                 exam_type='Engineering', max_score=360, passing_marks=90,
                 exam_date=datetime(2026, 5, 24), application_deadline=datetime(2026, 5, 1),
                 duration_minutes=360, total_questions=54,
                 min_age=17, max_age=25, required_education='12th', required_stream='Science',
                 min_percentage=75, max_attempts=2,
                 career_field='Engineering', difficulty_level='Very Hard', mode='Online', fee=2800,
                 website='https://jeeadv.ac.in', is_active=True),
            Exam(name='BITSAT', description='BITS Pilani entrance exam (May–Jun 2026)',
                 exam_type='Engineering', max_score=450, passing_marks=200,
                 exam_date=datetime(2026, 5, 20), application_deadline=datetime(2026, 4, 15),
                 duration_minutes=180, total_questions=150,
                 min_age=17, max_age=25, required_education='12th', required_stream='Science',
                 min_percentage=75, max_attempts=None,
                 career_field='Engineering', difficulty_level='Hard', mode='Online', fee=3400,
                 website='https://www.bitsadmission.com', is_active=True),
            Exam(name='VITEEE', description='VIT Engineering entrance exam 2026',
                 exam_type='Engineering', max_score=160, passing_marks=80,
                 exam_date=datetime(2026, 4, 18), application_deadline=datetime(2026, 3, 25),
                 duration_minutes=150, total_questions=125,
                 min_age=17, max_age=25, required_education='12th', required_stream='Science',
                 min_percentage=60, max_attempts=None,
                 career_field='Engineering', difficulty_level='Medium', mode='Online', fee=1350,
                 website='https://viteee.vit.ac.in', is_active=True),
            # Medical (3)
            Exam(name='NEET', description='National medical entrance exam (NEET UG 2026)',
                 exam_type='Medical', max_score=720, passing_marks=137,
                 exam_date=datetime(2026, 5, 3), application_deadline=datetime(2026, 3, 15),
                 duration_minutes=200, total_questions=180,
                 min_age=17, max_age=25, required_education='12th', required_stream='Medical',
                 min_percentage=50, max_attempts=3,
                 career_field='Medical', difficulty_level='Hard', mode='Offline', fee=1700,
                 website='https://neet.nta.ac.in', is_active=True),
            Exam(name='AIIMS', description='AIIMS admissions via NEET UG 2026',
                 exam_type='Medical', max_score=720, passing_marks=137,
                 exam_date=datetime(2026, 5, 3), application_deadline=datetime(2026, 3, 15),
                 duration_minutes=200, total_questions=180,
                 min_age=17, max_age=25, required_education='12th', required_stream='Medical',
                 min_percentage=50, max_attempts=3,
                 career_field='Medical', difficulty_level='Hard', mode='Offline', fee=1700,
                 website='https://neet.nta.ac.in', is_active=True),
            Exam(name='JIPMER', description='JIPMER admissions via NEET UG 2026',
                 exam_type='Medical', max_score=720, passing_marks=137,
                 exam_date=datetime(2026, 5, 3), application_deadline=datetime(2026, 3, 15),
                 duration_minutes=200, total_questions=180,
                 min_age=17, max_age=25, required_education='12th', required_stream='Medical',
                 min_percentage=50, max_attempts=3,
                 career_field='Medical', difficulty_level='Hard', mode='Offline', fee=1700,
                 website='https://neet.nta.ac.in', is_active=True),
            # Government (5)
            Exam(name='SSC CGL', description='Staff Selection Commission CGL Tier 1 (Jul–Aug 2026)',
                 exam_type='Government', max_score=200, passing_marks=130,
                 exam_date=datetime(2026, 7, 15), application_deadline=datetime(2026, 6, 10),
                 duration_minutes=60, total_questions=100,
                 min_age=18, max_age=32, required_education='Bachelor', required_stream=None,
                 min_percentage=None, max_attempts=None,
                 career_field='Government', difficulty_level='Medium', mode='Online', fee=100,
                 website='https://ssc.nic.in', is_active=True),
            Exam(name='SSC CHSL', description='SSC CHSL Tier 1 (Jun–Jul 2026)',
                 exam_type='Government', max_score=200, passing_marks=120,
                 exam_date=datetime(2026, 6, 22), application_deadline=datetime(2026, 5, 18),
                 duration_minutes=60, total_questions=100,
                 min_age=18, max_age=27, required_education='12th', required_stream=None,
                 min_percentage=None, max_attempts=None,
                 career_field='Government', difficulty_level='Medium', mode='Online', fee=100,
                 website='https://ssc.nic.in', is_active=True),
            Exam(name='UPSC Civil Services', description='UPSC CSE Prelims 2026 (May–Jun 2026)',
                 exam_type='Government', max_score=400, passing_marks=200,
                 exam_date=datetime(2026, 5, 31), application_deadline=datetime(2026, 3, 20),
                 duration_minutes=120, total_questions=100,
                 min_age=21, max_age=32, required_education='Bachelor', required_stream=None,
                 min_percentage=None, max_attempts=6,
                 career_field='Government', difficulty_level='Very Hard', mode='Offline', fee=100,
                 website='https://upsconline.nic.in', is_active=True),
            Exam(name='IBPS PO', description='IBPS PO Prelims 2026 (Sep–Oct 2026)',
                 exam_type='Government', max_score=200, passing_marks=80,
                 exam_date=datetime(2026, 10, 10), application_deadline=datetime(2026, 8, 25),
                 duration_minutes=60, total_questions=100,
                 min_age=20, max_age=30, required_education='Bachelor', required_stream=None,
                 min_percentage=None, max_attempts=None,
                 career_field='Banking', difficulty_level='Medium', mode='Online', fee=850,
                 website='https://www.ibps.in', is_active=True),
            Exam(name='RRB NTPC', description='RRB NTPC CBT 1 (Aug–Sep 2026)',
                 exam_type='Government', max_score=120, passing_marks=60,
                 exam_date=datetime(2026, 8, 20), application_deadline=datetime(2026, 7, 10),
                 duration_minutes=90, total_questions=100,
                 min_age=18, max_age=33, required_education='12th', required_stream=None,
                 min_percentage=None, max_attempts=None,
                 career_field='Railways', difficulty_level='Medium', mode='Online', fee=500,
                 website='https://www.rrbcdg.gov.in', is_active=True),
            # Management (3)
            Exam(name='CAT', description='CAT 2026 — MBA entrance for IIM admissions',
                 exam_type='Management', max_score=300, passing_marks=100,
                 exam_date=datetime(2026, 11, 29), application_deadline=datetime(2026, 9, 20),
                 duration_minutes=120, total_questions=66,
                 min_age=21, max_age=None, required_education='Bachelor', required_stream=None,
                 min_percentage=50, max_attempts=None,
                 career_field='Management', difficulty_level='Hard', mode='Online', fee=2400,
                 website='https://www.iimcat.ac.in', is_active=True),
            Exam(name='MAT', description='MAT Sep 2026 — Management aptitude test',
                 exam_type='Management', max_score=800, passing_marks=300,
                 exam_date=datetime(2026, 9, 6), application_deadline=datetime(2026, 8, 20),
                 duration_minutes=150, total_questions=200,
                 min_age=21, max_age=None, required_education='Bachelor', required_stream=None,
                 min_percentage=50, max_attempts=None,
                 career_field='Management', difficulty_level='Medium', mode='Online', fee=1800,
                 website='https://mat.aima.in', is_active=True),
            Exam(name='XAT', description='XAT 2026 — Xavier aptitude test for XLRI admissions',
                 exam_type='Management', max_score=120, passing_marks=50,
                 exam_date=datetime(2026, 1, 4), application_deadline=datetime(2025, 11, 30),
                 duration_minutes=180, total_questions=100,
                 min_age=21, max_age=None, required_education='Bachelor', required_stream=None,
                 min_percentage=50, max_attempts=None,
                 career_field='Management', difficulty_level='Hard', mode='Online', fee=2000,
                 website='https://xatonline.in', is_active=True),
            # Defence (1)
            Exam(name='NDA', description='NDA I 2026 — National Defence Academy (NDA II: Sep 2026)',
                 exam_type='Defence', max_score=900, passing_marks=350,
                 exam_date=datetime(2026, 4, 19), application_deadline=datetime(2026, 2, 15),
                 duration_minutes=150, total_questions=270,
                 min_age=16, max_age=19, required_education='12th', required_stream='Science',
                 min_percentage=None, max_attempts=2,
                 career_field='Defence', difficulty_level='Hard', mode='Offline', fee=100,
                 website='https://upsconline.nic.in', is_active=True),
        ]
        for exam in exams:
            db.session.add(exam)
        db.session.flush()
        print(f"✓ Seeded {len(exams)} exams")

    # ── SEED SCHOLARSHIPS (18) ───────────────────────────────
    if Scholarship.query.first() is None:
        scholarships = [
            # Government — MAHADBT (2)
            Scholarship(name='National Scholarship Scheme',
                        organization='Ministry of Education', amount=84000,
                        description='Renewable scholarship for meritorious SC/ST students',
                        eligibility_criteria='Maharashtra domicile, Valid Aadhaar, Caste certificate (SC/ST), Income certificate, 12th Pass with merit',
                        min_income=None, max_income=600000, required_category='SC',
                        required_education='12th', gender_eligibility=None,
                        deadline=datetime(2026, 3, 15), is_active=True,
                        website='https://mahadbt.maharashtra.gov.in',
                        portal_type='MAHADBT'),
            Scholarship(name='Post-Matric Scholarship',
                        organization='State Education Department', amount=60000,
                        description='Support for higher education after 10th standard',
                        eligibility_criteria='Maharashtra domicile, Valid Aadhaar, Caste certificate (SC), Income certificate, 10th Pass',
                        min_income=None, max_income=250000, required_category='SC',
                        required_education='10th', gender_eligibility=None,
                        deadline=datetime(2026, 4, 30), is_active=True,
                        website='https://mahadbt.maharashtra.gov.in',
                        portal_type='MAHADBT'),
            # Government — NSP (2)
            Scholarship(name='CURIE Scholarship',
                        organization='SERB - DST', amount=500000,
                        description='Women in Science - Young Scientist Awards',
                        eligibility_criteria='Indian citizenship, Income certificate, Academic merit, Registered on NSP portal, Physics/Chemistry/Biology Honours',
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', required_stream='Science',
                        gender_eligibility='Female',
                        deadline=datetime(2026, 2, 28), is_active=True,
                        website='https://scholarships.gov.in',
                        portal_type='NSP'),
            Scholarship(name='PM Scholarship for Teachers',
                        organization='MHRD', amount=36000,
                        description='For teacher training and professional development',
                        eligibility_criteria="Indian citizenship, Income certificate, Academic merit, Registered on NSP portal, Bachelor's Degree",
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 5, 15), is_active=True,
                        website='https://scholarships.gov.in',
                        portal_type='NSP'),
            # NGO (3)
            Scholarship(name='Pratham Education Scholarship',
                        organization='Pratham NGO', amount=20000,
                        description='Education support for underprivileged rural students',
                        eligibility_criteria='12th Pass, Income certificate',
                        min_income=None, max_income=150000, required_category=None,
                        required_education='12th', gender_eligibility=None,
                        deadline=datetime(2026, 3, 31), is_active=True,
                        website='https://www.pratham.org',
                        portal_type='NGO'),
            Scholarship(name='CRY Scholarship Programme',
                        organization='Child Rights and You', amount=25000,
                        description='Preventing child labour through education support',
                        eligibility_criteria='10th Pass, Merit, Income certificate',
                        min_income=None, max_income=200000, required_category=None,
                        required_education='10th', gender_eligibility=None,
                        deadline=datetime(2026, 4, 15), is_active=True,
                        website='https://www.cry.org',
                        portal_type='NGO'),
            Scholarship(name='Action for India Scholarship',
                        organization='Action for India', amount=50000,
                        description='Girl child education in rural areas',
                        eligibility_criteria='Class 9 onwards, Female only',
                        min_income=None, max_income=100000, required_category=None,
                        required_education='10th', gender_eligibility='Female',
                        deadline=datetime(2026, 3, 20), is_active=True,
                        website='https://www.actionforindia.org',
                        portal_type='NGO'),
            # Private Foundation (3)
            Scholarship(name='Ramakrishna Mission Scholarship',
                        organization='Ramakrishna Mission', amount=120000,
                        description='Scholarship emphasizing character and academics',
                        eligibility_criteria='12th Pass, Character Certificate, Income certificate',
                        min_income=None, max_income=300000, required_category=None,
                        required_education='12th', gender_eligibility=None,
                        deadline=datetime(2026, 3, 10), is_active=True,
                        website='https://www.rkmm.org',
                        portal_type='PRIVATE'),
            Scholarship(name='Tata Trusts STEM Scholarship',
                        organization='Tata Trusts', amount=200000,
                        description='Engineering and science education support',
                        eligibility_criteria='12th PCM/PCB, 70%+ marks, Income certificate',
                        min_income=None, max_income=500000, required_category=None,
                        required_education='12th', required_stream='Science',
                        min_percentage=70, gender_eligibility=None,
                        deadline=datetime(2026, 2, 20), is_active=True,
                        website='https://www.tatatrusts.org',
                        portal_type='PRIVATE'),
            Scholarship(name='Narayana Murthy Foundation Merit Award',
                        organization='Infosys Foundation', amount=150000,
                        description='Technology excellence and innovation support',
                        eligibility_criteria='BTech/BS in Technology, 7.5+ CGPA, Income certificate',
                        min_income=None, max_income=600000, required_category=None,
                        required_education='Bachelor', required_stream='Science',
                        min_percentage=75, gender_eligibility=None,
                        deadline=datetime(2026, 4, 30), is_active=True,
                        website='https://www.infosys.com/infosys-foundation',
                        portal_type='PRIVATE'),
            # Corporate CSR (3) — PRIVATE
            Scholarship(name='HCL Tech for Good Scholarship',
                        organization='HCL Corporation', amount=60000,
                        description='Digital literacy and IT skill development',
                        eligibility_criteria='12th Pass, Merit, Income certificate',
                        min_income=None, max_income=400000, required_category=None,
                        required_education='12th', gender_eligibility=None,
                        deadline=datetime(2026, 3, 25), is_active=True,
                        website='https://www.hcltech.com',
                        portal_type='PRIVATE'),
            Scholarship(name='Microsoft TEALS Scholarship',
                        organization='Microsoft', amount=100000,
                        description='Women in technology - coding and innovation',
                        eligibility_criteria='12th Pass, Interest in Technology, Female only',
                        min_income=None, max_income=None, required_category=None,
                        required_education='12th', gender_eligibility='Female',
                        deadline=datetime(2026, 2, 28), is_active=True,
                        website='https://www.microsoft.com/teals',
                        portal_type='PRIVATE'),
            Scholarship(name='Wipro Scholarship Program',
                        organization='Wipro', amount=120000,
                        description='Talent development for engineering and commerce graduates',
                        eligibility_criteria="Bachelor's degree ongoing/completed, Income certificate",
                        min_income=None, max_income=300000, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 4, 20), is_active=True,
                        website='https://www.wipro.com',
                        portal_type='PRIVATE'),
            # International (5)
            Scholarship(name='Inlaks Foundation Scholarship',
                        organization='Inlaks Foundation', amount=0,
                        description='Higher education at universities worldwide',
                        eligibility_criteria="Bachelor's degree + 2 yrs work ex, English proficiency, SOP required, Academic transcripts",
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 2, 15), is_active=True,
                        website='https://www.inlaksfoundation.org',
                        portal_type='INTERNATIONAL'),
            Scholarship(name='Chevening Scholarship',
                        organization='UK Government', amount=0,
                        description="Master's studies in UK universities",
                        eligibility_criteria="Bachelor's degree + 3 yrs work ex, English proficiency, SOP required, Academic transcripts",
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 1, 31), is_active=True,
                        website='https://www.chevening.org',
                        portal_type='INTERNATIONAL'),
            Scholarship(name='Fulbright Scholarship India',
                        organization='US Embassy', amount=0,
                        description='Educational exchange to United States universities',
                        eligibility_criteria="Bachelor's degree, Strong academics, English proficiency, SOP required, Academic transcripts",
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 9, 30), is_active=True,
                        website='https://www.usief.org.in',
                        portal_type='INTERNATIONAL'),
            Scholarship(name='DAAD Scholarship Germany',
                        organization='German Academic Exchange', amount=0,
                        description="Master's and research programmes in Germany",
                        eligibility_criteria="Bachelor's/Master's degree, English proficiency, SOP required, Academic transcripts",
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 12, 15), is_active=True,
                        website='https://www.daad.de',
                        portal_type='INTERNATIONAL'),
            Scholarship(name='New Zealand First Scholar',
                        organization='NZ Government', amount=0,
                        description='Studies at New Zealand universities',
                        eligibility_criteria='Strong academic record, English proficiency, SOP required, Academic transcripts',
                        min_income=None, max_income=None, required_category=None,
                        required_education='Bachelor', gender_eligibility=None,
                        deadline=datetime(2026, 3, 20), is_active=True,
                        website='https://www.nzscholarships.govt.nz',
                        portal_type='INTERNATIONAL'),
        ]
        for s in scholarships:
            db.session.add(s)
        db.session.flush()
        print(f"✓ Seeded {len(scholarships)} scholarships")

    try:
        db.session.commit()
        print("✓ Seed data committed successfully")
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error seeding data: {str(e)}")


if __name__ == '__main__':
    import sys
    
    env = os.getenv('FLASK_ENV', 'development')
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    
    print("\n")
    print("=" * 70)
    print("  🚀 AI Smart Scholarship and Exam Manager - Backend")
    print("=" * 70)
    print(f"  Environment:  {env}")
    print(f"  Server:       http://{host}:{port}")
    print(f"  API Base URL: http://localhost:{port}/api")
    print("  ")
    print("  Health Check: http://localhost:{port}/api/health")
    print("  Documentation: http://localhost:{port}/")
    print("=" * 70)
    print("\n  ✓ Backend is starting...")
    print(f"  ℹ️  If this is your first time, you may see database migration messages above.\n")
    
    try:
        app = create_app(env)
        print(f"  ✓ Flask app created successfully")
        print(f"  ✓ CORS enabled for localhost:* (development mode)")
        print(f"  ✓ Database initialized")
        print(f"\n  📝 Log file: {os.path.join(os.getcwd(), 'backend.log')}\n")
        print("=" * 70)
        print(f"  🎉 Server is running! Point your browser to http://localhost:5173")
        print("=" * 70 + "\n")
        
        app.run(host=host, port=port, debug=(env == 'development'))
    except Exception as e:
        print(f"\n❌ ERROR: Failed to start server")
        print(f"   {str(e)}")
        print(f"\n💡 Troubleshooting:")
        print(f"   1. Check if port {port} is already in use:")
        print(f"      Windows:  netstat -ano | findstr :{port}")
        print(f"      Mac/Linux: lsof -i :{port}")
        print(f"   2. Check database directory exists: {os.path.join(os.getcwd(), 'database')}")
        print(f"   3. Check all requirements are installed: pip install -r requirements.txt")
        print(f"\n")
        sys.exit(1)
