"""
Scholarship Recommendation Routes
Handles ML-based scholarship eligibility predictions and recommendations
"""

from flask import Blueprint, request, jsonify
from models.db_models import db, User, Scholarship, Application
from services.prediction_service import get_prediction_service
from services.validation import validate_recommendation_data
from datetime import datetime

recommendation_bp = Blueprint('recommendation', __name__, url_prefix='/api/recommend')


@recommendation_bp.route('/predict', methods=['POST'])
def predict_eligibility():
    """
    Predict scholarship eligibility for a user
    
    Expected JSON:
    {
        "user_id": 1,  # Optional, or use request data directly
        "age": 20,
        "category": "General",
        "income": 500000,
        "education_level": "12th",
        "stream": "Science"
    }
    """
    try:
        data = request.get_json()
        print(f"[PREDICT] Received data: {data}")

        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided',
                'errors': {}
            }), 400

        # Validate using validation service
        is_valid, errors = validate_recommendation_data(data)
        if not is_valid:
            print(f"[PREDICT] Validation errors: {errors}")
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'errors': errors
            }), 400

        try:
            # Ensure numeric types
            data['age'] = int(data['age'])
            data['income'] = float(data['income'])
        except (ValueError, TypeError) as e:
            return jsonify({
                'success': False,
                'error': f'Invalid data format: {str(e)}',
                'errors': {}
            }), 400
        
        # Get prediction service
        prediction_service = get_prediction_service()
        
        # Make prediction
        result = prediction_service.predict(data)
        print(f"[PREDICT] Result: {result}")
        
        if not result['success']:
            return jsonify(result), 400
        
        return jsonify(result), 200
    
    except Exception as e:
        print(f"[PREDICT] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Prediction error: {str(e)}',
            'errors': {}
        }), 500


@recommendation_bp.route('/scholarships', methods=['GET'])
def get_scholarships():
    """Get list of active scholarships with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Query active scholarships
        scholarships = Scholarship.query.filter_by(is_active=True).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'scholarships': [s.to_dict() for s in scholarships.items],
            'total': scholarships.total,
            'pages': scholarships.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching scholarships: {str(e)}'
        }), 500


@recommendation_bp.route('/scholarship/<int:scholarship_id>', methods=['GET'])
def get_scholarship(scholarship_id):
    """Get detailed scholarship information"""
    try:
        scholarship = Scholarship.query.get(scholarship_id)
        
        if not scholarship:
            return jsonify({
                'success': False,
                'error': 'Scholarship not found'
            }), 404
        
        return jsonify({
            'success': True,
            'scholarship': scholarship.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching scholarship: {str(e)}'
        }), 500


@recommendation_bp.route('/apply', methods=['POST'])
def apply_scholarship():
    """
    Apply for a scholarship
    
    Expected JSON:
    {
        "user_id": 1,
        "scholarship_id": 1
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('user_id') or not data.get('scholarship_id'):
            return jsonify({
                'success': False,
                'error': 'user_id and scholarship_id are required'
            }), 400
        
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Check if scholarship exists
        scholarship = Scholarship.query.get(data['scholarship_id'])
        if not scholarship:
            return jsonify({
                'success': False,
                'error': 'Scholarship not found'
            }), 404
        
        # Check if already applied
        existing_application = Application.query.filter_by(
            user_id=data['user_id'],
            scholarship_id=data['scholarship_id']
        ).first()
        
        if existing_application:
            return jsonify({
                'success': False,
                'error': 'You have already applied for this scholarship'
            }), 400
        
        # Get eligibility score
        prediction_service = get_prediction_service()
        user_data = {
            'age': user.age or 20,
            'category': user.category or 'General',
            'income': user.income or 500000,
            'education_level': user.education_level or '12th',
            'stream': user.stream or 'Science'
        }
        
        prediction = prediction_service.predict(user_data)
        
        # Create application
        application = Application(
            user_id=data['user_id'],
            scholarship_id=data['scholarship_id'],
            status='submitted',
            eligibility_score=prediction.get('eligibility_score'),
            recommendation_reason=prediction.get('recommendation')
        )
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'application': application.to_dict(),
            'prediction': {
                'eligibility_score': prediction.get('eligibility_score'),
                'recommendation': prediction.get('recommendation'),
                'explanation': prediction.get('explanation')
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error submitting application: {str(e)}'
        }), 500


@recommendation_bp.route('/applications/<int:user_id>', methods=['GET'])
def get_user_applications(user_id):
    """Get all applications for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        applications = Application.query.filter_by(user_id=user_id).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'applications': [a.to_dict() for a in applications.items],
            'total': applications.total,
            'pages': applications.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching applications: {str(e)}'
        }), 500


@recommendation_bp.route('/dashboard/<int:user_id>', methods=['GET'])
def get_dashboard_stats(user_id):
    """Get dashboard statistics for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Count statistics
        total_scholarships = Scholarship.query.filter_by(is_active=True).count()
        user_applications = Application.query.filter_by(user_id=user_id).count()
        approved_applications = Application.query.filter_by(
            user_id=user_id,
            status='approved'
        ).count()
        
        # Get user profile
        prediction_service = get_prediction_service()
        user_data = {
            'age': user.age or 20,
            'category': user.category or 'General',
            'income': user.income or 500000,
            'education_level': user.education_level or '12th',
            'stream': user.stream or 'Science'
        }
        
        eligibility = prediction_service.predict(user_data)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_scholarships': total_scholarships,
                'applications_submitted': user_applications,
                'approved_applications': approved_applications,
                'eligibility_score': eligibility.get('eligibility_score'),
                'eligibility_status': 'Eligible' if eligibility.get('eligible') else 'Ineligible',
                'recommendation': eligibility.get('recommendation')
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching dashboard stats: {str(e)}'
        }), 500
