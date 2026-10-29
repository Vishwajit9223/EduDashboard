"""
Authentication Routes
Handles user registration, login, and profile management
"""

from flask import Blueprint, request, jsonify
from models.db_models import db, User
from services.validation import validate_registration_data, validate_login_data

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Expected JSON:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "secure_password",
        "age": 20,
        "category": "General",
        "income": 500000,
        "education_level": "12th",
        "stream": "Science"
    }
    """
    try:
        data = request.get_json()
        print(f"[REGISTER] Received registration request: {data}")
        
        # Validate using validation service
        is_valid, errors = validate_registration_data(data)
        if not is_valid:
            print(f"[REGISTER] Validation errors: {errors}")
            return jsonify({
                'success': False,
                'message': 'Validation failed',
                'errors': errors
            }), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email'].strip().lower()).first():
            print(f"[REGISTER] Email already registered: {data['email']}")
            return jsonify({
                'success': False,
                'message': 'Email already registered',
                'errors': {'email': 'This email is already registered'}
            }), 400
        
        # Create new user
        user = User(
            name=data['name'].strip(),
            email=data['email'].strip().lower(),
            age=data.get('age'),
            category=data.get('category'),
            income=data.get('income'),
            education_level=data.get('education_level'),
            stream=data.get('stream')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        print(f"[REGISTER] User registered successfully: {user.email}")
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"[REGISTER] Error during registration: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error during registration: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and return user data
    
    Expected JSON:
    {
        "email": "john@example.com",
        "password": "secure_password"
    }
    """
    try:
        data = request.get_json()
        print(f"[LOGIN] Login attempt for email: {data.get('email')}")
        
        # Validate using validation service
        is_valid, errors = validate_login_data(data)
        if not is_valid:
            print(f"[LOGIN] Validation errors: {errors}")
            return jsonify({
                'success': False,
                'message': 'Validation failed',
                'errors': errors
            }), 400
        
        # Find user by email (case-insensitive)
        user = User.query.filter_by(email=data['email'].strip().lower()).first()
        
        if not user or not user.check_password(data['password']):
            print(f"[LOGIN] Invalid credentials for: {data.get('email')}")
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        print(f"[LOGIN] Login successful for: {user.email}")
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error during login: {str(e)}'
        }), 500


@auth_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching profile: {str(e)}'
        }), 500


@auth_bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    """
    Update user profile
    
    Expected JSON (all fields optional):
    {
        "name": "John Doe",
        "age": 20,
        "category": "General",
        "income": 500000,
        "education_level": "12th",
        "stream": "Science"
    }
    """
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['name', 'age', 'category', 'income', 'education_level', 'stream']
        for field in allowed_fields:
            if field in data and data[field] is not None:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating profile: {str(e)}'
        }), 500


@auth_bp.route('/change-password/<int:user_id>', methods=['POST'])
def change_password(user_id):
    """
    Change user password
    
    Expected JSON:
    {
        "current_password": "old_password",
        "new_password": "new_password"
    }
    """
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({
                'success': False,
                'message': 'Current password and new password are required'
            }), 400
        
        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401
        
        # Set new password
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error changing password: {str(e)}'
        }), 500
