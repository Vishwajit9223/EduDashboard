"""
Database Models for AI Smart Scholarship and Exam Manager
Defines all database tables using SQLAlchemy ORM
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize SQLAlchemy
db = SQLAlchemy()


class User(db.Model):
    """User model for storing user profile information"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)  # Phone number
    age = db.Column(db.Integer, nullable=True)
    category = db.Column(db.String(50), nullable=True)  # SC, ST, OBC, General
    income = db.Column(db.Float, nullable=True)  # Annual family income
    education_level = db.Column(db.String(50), nullable=True)  # 10th, 12th, Bachelor, Master
    stream = db.Column(db.String(50), nullable=True)  # Science, Commerce, Arts
    is_admin = db.Column(db.Boolean, default=False, index=True)  # Admin flag
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='user', lazy=True, cascade='all,delete-orphan')
    exam_attempts = db.relationship('ExamAttempt', backref='user', lazy=True, cascade='all,delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'age': self.age,
            'category': self.category,
            'income': self.income,
            'education_level': self.education_level,
            'stream': self.stream,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Scholarship(db.Model):
    """Scholarship model for storing scholarship details"""
    
    __tablename__ = 'scholarships'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True, index=True)
    organization = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    eligibility_criteria = db.Column(db.Text, nullable=True)
    
    # Eligibility fields for matching
    min_income = db.Column(db.Float, nullable=True)
    max_income = db.Column(db.Float, nullable=True)
    min_age = db.Column(db.Integer, nullable=True)
    max_age = db.Column(db.Integer, nullable=True)
    required_category = db.Column(db.String(50), nullable=True)  # Null means all categories
    required_education = db.Column(db.String(50), nullable=True)  # Null means all
    required_stream = db.Column(db.String(50), nullable=True)  # Null means all
    min_percentage = db.Column(db.Float, nullable=True)
    state_eligibility = db.Column(db.String(100), nullable=True)  # Null means all states
    gender_eligibility = db.Column(db.String(20), nullable=True)  # Null means any
    
    deadline = db.Column(db.DateTime, nullable=True)
    website = db.Column(db.String(500), nullable=True)
    portal_type = db.Column(db.String(50), nullable=True)  # MAHADBT, NSP, PRIVATE, NGO, INTERNATIONAL
    is_active = db.Column(db.Boolean, default=True, index=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='scholarship', lazy=True, cascade='all,delete-orphan')
    
    def to_dict(self):
        """Convert scholarship object to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'organization': self.organization,
            'amount': self.amount,
            'description': self.description,
            'eligibility_criteria': self.eligibility_criteria,
            'min_income': self.min_income,
            'max_income': self.max_income,
            'min_age': self.min_age,
            'max_age': self.max_age,
            'required_category': self.required_category,
            'required_education': self.required_education,
            'required_stream': self.required_stream,
            'min_percentage': self.min_percentage,
            'state_eligibility': self.state_eligibility,
            'gender_eligibility': self.gender_eligibility,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'website': self.website,
            'portal_type': self.portal_type,
            'is_active': self.is_active
        }


class Exam(db.Model):
    """Exam model for storing exam information"""
    
    __tablename__ = 'exams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    exam_type = db.Column(db.String(50), nullable=False)  # JEE, NEET, CAT, etc.
    max_score = db.Column(db.Float, default=100.0)
    
    # Exam schedule
    exam_date = db.Column(db.DateTime, nullable=True)
    application_deadline = db.Column(db.DateTime, nullable=True)
    
    # Exam details
    duration_minutes = db.Column(db.Integer, nullable=True)  # Duration in minutes
    total_questions = db.Column(db.Integer, nullable=True)
    passing_marks = db.Column(db.Float, nullable=True)
    website = db.Column(db.String(500), nullable=True)
    
    # Eligibility Constraints
    min_age = db.Column(db.Integer, nullable=True)
    max_age = db.Column(db.Integer, nullable=True)
    required_education = db.Column(db.String(50), nullable=True, index=True)
    required_stream = db.Column(db.String(50), nullable=True)
    required_category = db.Column(db.String(50), nullable=True)
    min_percentage = db.Column(db.Float, nullable=True)
    max_attempts = db.Column(db.Integer, nullable=True)
    
    # Classification
    career_field = db.Column(db.String(100), nullable=True, index=True)
    difficulty_level = db.Column(db.String(50), nullable=True)
    mode = db.Column(db.String(50), nullable=True)  # Online, Offline, Hybrid
    fee = db.Column(db.Float, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attempts = db.relationship('ExamAttempt', backref='exam', lazy=True, cascade='all,delete-orphan')
    
    def to_dict(self):
        """Convert exam object to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'exam_type': self.exam_type,
            'max_score': self.max_score,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'duration_minutes': self.duration_minutes,
            'total_questions': self.total_questions,
            'passing_marks': self.passing_marks,
            'website': self.website,
            'min_age': self.min_age,
            'max_age': self.max_age,
            'required_education': self.required_education,
            'required_stream': self.required_stream,
            'required_category': self.required_category,
            'min_percentage': self.min_percentage,
            'max_attempts': self.max_attempts,
            'career_field': self.career_field,
            'difficulty_level': self.difficulty_level,
            'mode': self.mode,
            'fee': self.fee,
            'is_active': self.is_active
        }


class Application(db.Model):
    """Scholarship application model for tracking user applications"""
    
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarships.id'), nullable=False, index=True)
    
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected, submitted
    eligibility_score = db.Column(db.Float, nullable=True)  # ML model score (0-1)
    recommendation_reason = db.Column(db.Text, nullable=True)  # Explanation from ML model
    
    applied_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    response_date = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert application object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'scholarship_id': self.scholarship_id,
            'scholarship_name': self.scholarship.name if self.scholarship else None,
            'status': self.status,
            'eligibility_score': self.eligibility_score,
            'recommendation_reason': self.recommendation_reason,
            'applied_date': self.applied_date.isoformat(),
            'response_date': self.response_date.isoformat() if self.response_date else None
        }


class ExamAttempt(db.Model):
    """Exam attempt model for tracking exam participation"""
    
    __tablename__ = 'exam_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False, index=True)
    
    status = db.Column(db.String(50), default='registered')  # registered, appeared, passed, failed
    score = db.Column(db.Float, nullable=True)
    percentile = db.Column(db.Float, nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    
    attempt_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert exam attempt object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'exam_id': self.exam_id,
            'exam_name': self.exam.name if self.exam else None,
            'status': self.status,
            'score': self.score,
            'percentile': self.percentile,
            'remarks': self.remarks,
            'attempt_date': self.attempt_date.isoformat() if self.attempt_date else None
        }
