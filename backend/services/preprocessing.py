"""
Data preprocessing utilities for ML model
Handles feature engineering and data normalization
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Mapping for categorical variables
CATEGORY_MAPPING = {
    'General': 0,
    'OBC': 1,
    'SC': 2,
    'ST': 3
}

EDUCATION_MAPPING = {
    '10th': 0,
    '12th': 1,
    'Bachelor': 2,
    'Master': 3,
    'PhD': 4
}

STREAM_MAPPING = {
    'Arts': 0,
    'Commerce': 1,
    'Science': 2,
    'Engineering': 3
}

REVERSE_CATEGORY_MAPPING = {v: k for k, v in CATEGORY_MAPPING.items()}
REVERSE_EDUCATION_MAPPING = {v: k for k, v in EDUCATION_MAPPING.items()}
REVERSE_STREAM_MAPPING = {v: k for k, v in STREAM_MAPPING.items()}


class DataPreprocessor:
    """
    Handles data preprocessing and feature engineering
    """
    
    FEATURE_ORDER = ['age', 'category_encoded', 'income', 'education_encoded', 'stream_encoded']
    
    @staticmethod
    def encode_categorical_features(data):
        """
        Encode categorical features to numerical values
        
        Args:
            data (dict): Input data with categorical variables
            
        Returns:
            dict: Data with encoded categorical variables
        """
        processed = data.copy()
        
        # Encode category
        if 'category' in processed:
            processed['category_encoded'] = CATEGORY_MAPPING.get(
                processed['category'], 0
            )
        
        # Encode education level
        if 'education_level' in processed:
            processed['education_encoded'] = EDUCATION_MAPPING.get(
                processed['education_level'], 0
            )
        
        # Encode stream
        if 'stream' in processed:
            processed['stream_encoded'] = STREAM_MAPPING.get(
                processed['stream'], 0
            )
        
        return processed
    
    @staticmethod
    def normalize_numeric_features(data, scaler=None):
        """
        Normalize numeric features using StandardScaler
        
        The scaler is trained on ALL 5 features in FEATURE_ORDER:
        [age, category_encoded, income, education_encoded, stream_encoded]
        
        Args:
            data (dict): Processed data with encoded features
            scaler (StandardScaler, optional): Fitted scaler. If None, creates new one.
            
        Returns:
            tuple: (normalized_data, scaler)
        """
        # Build the full 5-feature vector that matches the training scaler
        values = np.array([[
            float(data.get('age', 25)),
            float(data.get('category_encoded', 0)),
            float(data.get('income', 100000)),
            float(data.get('education_encoded', 0)),
            float(data.get('stream_encoded', 0)),
        ]])
        
        if scaler is None:
            scaler = StandardScaler()
            normalized = scaler.fit_transform(values)
        else:
            normalized = scaler.transform(values)
        
        # Store the full scaled vector for model input
        data['_scaled_features'] = normalized[0]
        
        return data, scaler
    
    @staticmethod
    def prepare_features(data, scaler=None):
        """
        Prepare complete feature vector for ML model
        
        Args:
            data (dict): Raw input data
            scaler (StandardScaler, optional): Fitted scaler
            
        Returns:
            tuple: (feature_array, processed_data, scaler)
        """
        # Step 1: Encode categorical features
        processed = DataPreprocessor.encode_categorical_features(data)
        
        # Step 2: Normalize all features using the scaler
        processed, scaler = DataPreprocessor.normalize_numeric_features(processed, scaler)
        
        # Step 3: Use the scaled features directly (already in correct order)
        if '_scaled_features' in processed:
            feature_vector = processed['_scaled_features'].reshape(1, -1)
        else:
            # Fallback: construct raw feature vector
            feature_vector = np.array([[
                float(processed.get('age', 25)),
                float(processed.get('category_encoded', 0)),
                float(processed.get('income', 100000)),
                float(processed.get('education_encoded', 0)),
                float(processed.get('stream_encoded', 0))
            ]])
        
        return feature_vector, processed, scaler
    
    @staticmethod
    def create_explanation(processed_data):
        """
        Create human-readable explanation for the recommendation
        
        Args:
            processed_data (dict): Processed data with results
            
        Returns:
            str: Explanation text
        """
        parts = []
        
        # Age consideration
        age = processed_data.get('age', 'N/A')
        if age != 'N/A':
            parts.append(f"Age: {age} years old")
        
        # Category consideration
        category = processed_data.get('category', 'General')
        parts.append(f"Category: {category}")
        
        # Income consideration
        income = processed_data.get('income', 'N/A')
        if income != 'N/A':
            income_str = f"₹{income:,.0f}" if isinstance(income, (int, float)) else income
            parts.append(f"Annual Income: {income_str}")
        
        # Education consideration
        education = processed_data.get('education_level', 'N/A')
        if education != 'N/A':
            parts.append(f"Education Level: {education}")
        
        # Stream consideration
        stream = processed_data.get('stream', 'N/A')
        if stream != 'N/A':
            parts.append(f"Stream: {stream}")
        
        return " • ".join(parts)


def validate_input_data(data):
    """
    Validate input data for ML model
    
    Args:
        data (dict): Input data to validate
        
    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['age', 'category', 'income', 'education_level', 'stream']
    
    for field in required_fields:
        if field not in data or data[field] is None:
            return False, f"Missing required field: {field}"
    
    # Validate age
    try:
        age = int(data['age'])
        if age < 13 or age > 80:
            return False, "Age must be between 13 and 80"
    except (ValueError, TypeError):
        return False, "Age must be a valid number"
    
    # Validate income
    try:
        income = float(data['income'])
        if income < 0:
            return False, "Income must be non-negative"
    except (ValueError, TypeError):
        return False, "Income must be a valid number"
    
    # Validate category
    if data['category'] not in CATEGORY_MAPPING:
        return False, f"Invalid category. Must be one of: {', '.join(CATEGORY_MAPPING.keys())}"
    
    # Validate education
    if data['education_level'] not in EDUCATION_MAPPING:
        return False, f"Invalid education level. Must be one of: {', '.join(EDUCATION_MAPPING.keys())}"
    
    # Validate stream
    if data['stream'] not in STREAM_MAPPING:
        return False, f"Invalid stream. Must be one of: {', '.join(STREAM_MAPPING.keys())}"
    
    return True, "Data is valid"
