"""
Validation Utilities for Backend
Centralized validation functions for all forms and API endpoints
"""

import re
from typing import Dict, Tuple, Any


class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email format
    
    Args:
        email: Email to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email or not isinstance(email, str):
        return False, 'Email is required'
    
    email = email.strip()
    if not email:
        return False, 'Email is required'
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, 'Invalid email format'
    
    return True, ''


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password or not isinstance(password, str):
        return False, 'Password is required'
    
    if len(password) < 6:
        return False, 'Password must be at least 6 characters'
    
    return True, ''


def validate_name(name: str) -> Tuple[bool, str]:
    """
    Validate name
    
    Args:
        name: Name to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name or not isinstance(name, str):
        return False, 'Name is required'
    
    name = name.strip()
    if not name:
        return False, 'Name is required'
    
    if len(name) < 3:
        return False, 'Name must be at least 3 characters'
    
    return True, ''


def validate_phone(phone: str) -> Tuple[bool, str]:
    """
    Validate phone number (exactly 10 digits)
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not phone or not isinstance(phone, str):
        return False, 'Phone number is required'
    
    phone = phone.strip()
    if not phone:
        return False, 'Phone number is required'
    
    if not re.match(r'^[0-9]{10}$', phone):
        return False, 'Phone number must be exactly 10 digits'
    
    return True, ''


def validate_age(age: any, min_age: int = 13, max_age: int = 80) -> Tuple[bool, str]:
    """
    Validate age (number within range)
    
    Args:
        age: Age to validate
        min_age: Minimum age
        max_age: Maximum age
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if age is None or age == '':
        return False, 'Age is required'
    
    try:
        age_num = int(age)
    except (ValueError, TypeError):
        return False, 'Age must be a valid number'
    
    if age_num < min_age or age_num > max_age:
        return False, f'Age must be between {min_age} and {max_age}'
    
    return True, ''


def validate_income(income: any) -> Tuple[bool, str]:
    """
    Validate income (positive number)
    
    Args:
        income: Income to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if income is None or income == '':
        return False, 'Annual income is required'
    
    try:
        income_num = float(income)
    except (ValueError, TypeError):
        return False, 'Income must be a valid number'
    
    if income_num < 0:
        return False, 'Income cannot be negative'
    
    return True, ''


def validate_registration_data(data: Dict[str, Any]) -> Tuple[bool, Dict[str, str]]:
    """
    Validate registration form data
    
    Args:
        data: Form data dictionary
        
    Returns:
        Tuple of (is_valid, errors_dict)
    """
    errors = {}
    
    # Validate name
    valid, msg = validate_name(data.get('name', ''))
    if not valid:
        errors['name'] = msg
    
    # Validate email
    valid, msg = validate_email(data.get('email', ''))
    if not valid:
        errors['email'] = msg
    
    # Validate password
    valid, msg = validate_password(data.get('password', ''))
    if not valid:
        errors['password'] = msg
    
    # Validate age if provided
    if data.get('age') not in [None, '']:
        valid, msg = validate_age(data.get('age'))
        if not valid:
            errors['age'] = msg
    
    # Validate income if provided
    if data.get('income') not in [None, '']:
        valid, msg = validate_income(data.get('income'))
        if not valid:
            errors['income'] = msg
    
    return len(errors) == 0, errors


def validate_login_data(data: Dict[str, Any]) -> Tuple[bool, Dict[str, str]]:
    """
    Validate login form data
    
    Args:
        data: Form data dictionary
        
    Returns:
        Tuple of (is_valid, errors_dict)
    """
    errors = {}
    
    # Validate email
    valid, msg = validate_email(data.get('email', ''))
    if not valid:
        errors['email'] = msg
    
    # Validate password
    valid, msg = validate_password(data.get('password', ''))
    if not valid:
        errors['password'] = msg
    
    return len(errors) == 0, errors


def validate_recommendation_data(data: Dict[str, Any]) -> Tuple[bool, Dict[str, str]]:
    """
    Validate recommendation form data
    
    Args:
        data: Form data dictionary
        
    Returns:
        Tuple of (is_valid, errors_dict)
    """
    errors = {}
    
    # Validate age
    valid, msg = validate_age(data.get('age', ''))
    if not valid:
        errors['age'] = msg
    
    # Validate income
    valid, msg = validate_income(data.get('income', ''))
    if not valid:
        errors['income'] = msg
    
    # Validate category
    if not data.get('category'):
        errors['category'] = 'Category is required'
    
    # Validate education_level
    if not data.get('education_level'):
        errors['education_level'] = 'Education level is required'
    
    # Validate stream
    if not data.get('stream'):
        errors['stream'] = 'Stream is required'
    
    return len(errors) == 0, errors
