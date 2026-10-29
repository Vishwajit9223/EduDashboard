"""
Users Routes
Handles user listing and management endpoints
Admin-only access for user management endpoints
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from models.db_models import db, User

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


def token_required(f):
    """Decorator to check if user is authenticated"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        authorization = request.headers.get('Authorization')
        
        if authorization:
            try:
                token = authorization.split(" ")[1]
            except IndexError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid authorization header'
                }), 401
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing'
            }), 401
        
        try:
            # Token is the user ID (as per the frontend implementation)
            user_id = int(token)
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Invalid token or user not found'
                }), 401
            
            request.user = user
            return f(*args, **kwargs)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': 'Invalid token format'
            }), 401
    
    return decorated


def admin_required(f):
    """Decorator to check if user is admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or not request.user.is_admin:
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        return f(*args, **kwargs)
    
    return decorated


@users_bp.route('', methods=['GET'])
@token_required
@admin_required
def get_users():
    """
    Get all registered users with pagination and search support
    
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 10, max: 100)
    - q: Search query (searches by name or email)
    
    Response:
    {
        'success': True,
        'data': [
            {
                'id': 1,
                'name': 'John Doe',
                'email': 'john@example.com',
                'phone': '9876543210',
                'educationLevel': '12th',
                'course': 'Science',
                'registrationDate': '2024-01-15T10:30:00'
            }
        ],
        'pagination': {
            'page': 1,
            'per_page': 10,
            'total': 45,
            'pages': 5
        }
    }
    """
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)  # Max 100 per page
        search_query = request.args.get('q', '').strip()
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = 10
        
        # Build query
        query = User.query
        
        # Apply search filter if provided
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                (User.name.ilike(search_pattern)) |
                (User.email.ilike(search_pattern))
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination
        users = query.order_by(User.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Build response data
        users_data = []
        for user in users.items:
            users_data.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone or 'N/A',
                'educationLevel': user.education_level or 'Not specified',
                'course': user.stream or 'Not specified',
                'registrationDate': user.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': users_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': users.pages
            }
        }), 200
    
    except Exception as e:
        print(f"[USERS] Error fetching users: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error fetching users: {str(e)}'
        }), 500


@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(user_id):
    """Get a single user by ID"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone or 'N/A',
                'age': user.age,
                'category': user.category,
                'income': user.income,
                'educationLevel': user.education_level,
                'course': user.stream,
                'registrationDate': user.created_at.isoformat()
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching user: {str(e)}'
        }), 500
