"""
ML Model Prediction Service
Handles loading and using the trained scholarship eligibility model
+ Hybrid recommendation engine for scholarships and exams
"""

import os
import joblib
import numpy as np
from .preprocessing import DataPreprocessor, validate_input_data, EDUCATION_MAPPING, STREAM_MAPPING


# ── Education hierarchy for matching ────────────────────────
# Higher value = higher level.  Used to check "user meets minimum".
_EDU_RANK = {
    '10th': 1, '12th': 2, 'Bachelor': 3, 'Master': 4, 'PhD': 5,
}

# Stream compatibility map (user_stream → compatible DB streams)
_STREAM_COMPAT = {
    'Science':     {'Science', 'Medical', 'Engineering', None},
    'Engineering': {'Science', 'Engineering', None},
    'Commerce':    {'Commerce', None},
    'Arts':        {'Arts', None},
    'Medical':     {'Medical', 'Science', None},
}

# Difficulty preference by education level
_DIFFICULTY_PREF = {
    '10th':     {'Easy': 1.0, 'Medium': 0.7, 'Hard': 0.3, 'Very Hard': 0.1},
    '12th':     {'Easy': 0.8, 'Medium': 1.0, 'Hard': 0.6, 'Very Hard': 0.3},
    'Bachelor': {'Easy': 0.5, 'Medium': 0.8, 'Hard': 1.0, 'Very Hard': 0.7},
    'Master':   {'Easy': 0.3, 'Medium': 0.6, 'Hard': 0.9, 'Very Hard': 1.0},
    'PhD':      {'Easy': 0.2, 'Medium': 0.5, 'Hard': 0.8, 'Very Hard': 1.0},
}


class PredictionService:
    """
    Service for making scholarship eligibility predictions using trained ML model
    + hybrid recommendation for scholarships and exams
    """
    
    def __init__(self, model_path='models/scholarship_model.pkl', 
                 scaler_path='models/feature_scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.is_loaded = False
        self.error_message = None
    
    def load_model(self):
        """Load the trained model and scaler from disk"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.is_loaded = True
            else:
                self.error_message = f"Model file not found at {self.model_path}"
                self.is_loaded = False
            
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
            
            return self.is_loaded
        except Exception as e:
            self.error_message = f"Error loading model: {str(e)}"
            self.is_loaded = False
            return False
    
    # ────────────────────────────────────────────────────────
    # Main predict() — now returns top scholarships + exams
    # ────────────────────────────────────────────────────────
    def predict(self, user_data):
        """
        Predict scholarship eligibility AND return ranked recommendations.

        Returns dict with original keys preserved plus:
            top_scholarships, top_exams
        """
        # Validate input
        is_valid, validation_msg = validate_input_data(user_data)
        if not is_valid:
            return {
                'success': False,
                'error': validation_msg,
                'eligibility_score': None,
                'recommendation': None
            }
        
        # Load model if needed
        if not self.is_loaded:
            self.load_model()   # non-fatal — fallback below
        
        try:
            # ── ML eligibility score ─────────────────────────
            if self.is_loaded and self.model is not None:
                features, processed_data, _ = DataPreprocessor.prepare_features(
                    user_data, self.scaler
                )
                eligibility_score = float(self.model.predict_proba(features)[0][1])
            else:
                processed_data = DataPreprocessor.encode_categorical_features(user_data)
                eligibility_score = self._rule_based_prediction(user_data)

            # ── Hybrid recommendations ───────────────────────
            top_scholarships = self.recommend_scholarships(user_data, eligibility_score)
            top_exams = self.recommend_exams(user_data)

            recommendation = self._generate_recommendation(eligibility_score, processed_data)
            explanation = DataPreprocessor.create_explanation(processed_data)
            
            return {
                'success': True,
                'eligibility_score': round(eligibility_score, 3),
                'eligible': eligibility_score >= 0.5,
                'recommendation': recommendation,
                'explanation': explanation,
                'top_scholarships': top_scholarships,
                'top_exams': top_exams,
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': f"Prediction error: {str(e)}",
                'eligibility_score': None,
                'recommendation': None
            }
    
    # ────────────────────────────────────────────────────────
    # Scholarship ranking (hybrid: ML + structured)
    # ────────────────────────────────────────────────────────
    def recommend_scholarships(self, user_data, ml_score=0.5, top_n=5):
        """
        Rank active scholarships using hybrid scoring.

        Structured weights:
            income 25% | category 20% | education 20% |
            stream 15% | age 10% | percentage 10%

        Final = 0.4 * ml_score + 0.6 * structured_score
        """
        from models.db_models import Scholarship

        scholarships = Scholarship.query.filter_by(is_active=True).all()
        scored = []

        user_age   = int(user_data.get('age', 20))
        user_income = float(user_data.get('income', 500000))
        user_cat   = user_data.get('category', 'General')
        user_edu   = user_data.get('education_level', '12th')
        user_stream = user_data.get('stream', 'Science')
        user_pct   = float(user_data.get('percentage', 0))

        for s in scholarships:
            struct = 0.0

            # Income match (25%)
            if s.max_income is not None:
                struct += 0.25 if user_income <= s.max_income else 0.0
            else:
                struct += 0.25  # no cap → everyone qualifies

            # Category match (20%)
            if s.required_category is None or s.required_category == user_cat:
                struct += 0.20
            elif s.required_category in ('SC', 'ST') and user_cat in ('SC', 'ST'):
                struct += 0.15  # partial match SC↔ST

            # Education match (20%)
            struct += 0.20 * _education_match(user_edu, s.required_education)

            # Stream match (15%)
            struct += 0.15 * _stream_match(user_stream, s.required_stream)

            # Age match (10%)
            struct += 0.10 * _age_match(user_age, s.min_age, s.max_age)

            # Percentage match (10%)
            if s.min_percentage is not None:
                struct += 0.10 if user_pct >= s.min_percentage else 0.0
            else:
                struct += 0.10

            final = 0.4 * ml_score + 0.6 * struct
            scored.append((s, round(final, 3)))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [
            {
                'id':           s.id,
                'name':         s.name,
                'organization': s.organization,
                'amount':       s.amount,
                'match_score':  sc,
                'deadline':     s.deadline.strftime('%Y-%m-%d') if s.deadline else None,
                'description':  s.description,
            }
            for s, sc in scored[:top_n]
        ]

    # ────────────────────────────────────────────────────────
    # Exam ranking (structured only — no ML)
    # ────────────────────────────────────────────────────────
    def recommend_exams(self, user_data, top_n=5):
        """
        Rank active exams using structured scoring only.

        Weights:
            education 25% | stream 20% | age 15% |
            category 10% | percentage 10% |
            career_field 10% | difficulty 10%
        """
        from models.db_models import Exam

        exams = Exam.query.filter_by(is_active=True).all()
        scored = []

        user_age    = int(user_data.get('age', 20))
        user_edu    = user_data.get('education_level', '12th')
        user_stream = user_data.get('stream', 'Science')
        user_cat    = user_data.get('category', 'General')
        user_pct    = float(user_data.get('percentage', 0))

        for e in exams:
            struct = 0.0

            # Education match (25%)
            struct += 0.25 * _education_match(user_edu, e.required_education)

            # Stream match (20%)
            struct += 0.20 * _stream_match(user_stream, e.required_stream)

            # Age match (15%)
            struct += 0.15 * _age_match(user_age, e.min_age, e.max_age)

            # Category match (10%)
            if e.required_category is None or e.required_category == user_cat:
                struct += 0.10

            # Percentage match (10%)
            if e.min_percentage is not None:
                struct += 0.10 if user_pct >= e.min_percentage else 0.0
            else:
                struct += 0.10

            # Career-field alignment (10%)
            struct += 0.10 * _career_align(user_stream, e.career_field)

            # Difficulty alignment (10%)
            pref_map = _DIFFICULTY_PREF.get(user_edu, {})
            struct += 0.10 * pref_map.get(e.difficulty_level, 0.5)

            scored.append((e, round(struct, 3)))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [
            {
                'id':              e.id,
                'name':            e.name,
                'exam_type':       e.exam_type,
                'match_score':     sc,
                'exam_date':       e.exam_date.strftime('%Y-%m-%d') if e.exam_date else None,
                'difficulty_level': e.difficulty_level,
                'description':     e.description,
            }
            for e, sc in scored[:top_n]
        ]

    # ────────────────────────────────────────────────────────
    # Fallback rule-based ML score
    # ────────────────────────────────────────────────────────
    def _rule_based_prediction(self, user_data):
        score = 0.5
        income = float(user_data.get('income', 500000))
        if income < 100000:
            score += 0.15
        elif income < 300000:
            score += 0.10
        category = user_data.get('category', 'General')
        if category in ['SC', 'ST']:
            score += 0.15
        elif category == 'OBC':
            score += 0.10
        education = user_data.get('education_level', '12th')
        if education in ['Master', 'PhD']:
            score += 0.10
        return min(score, 1.0)
    
    def _generate_recommendation(self, score, processed_data):
        category = processed_data.get('category', 'Unknown')
        if score >= 0.8:
            return f"Excellent match! You have a strong profile for multiple scholarships as a {category} candidate."
        elif score >= 0.6:
            return f"Good match! You qualify for many scholarships. Start applying today!"
        elif score >= 0.4:
            return f"Fair match! You may qualify for some scholarships based on your {category} status."
        else:
            return "You may want to improve your profile. Consider exploring more educational opportunities."
    
    def batch_predict(self, users_data_list):
        results = []
        for user_data in users_data_list:
            results.append(self.predict(user_data))
        return results


# ── Module-level helpers ────────────────────────────────────

def _education_match(user_edu, required_edu):
    """Return 0-1 score: 1 if user meets or exceeds required level."""
    if required_edu is None:
        return 1.0
    user_rank = _EDU_RANK.get(user_edu, 0)
    req_rank  = _EDU_RANK.get(required_edu, 0)
    if user_rank >= req_rank:
        return 1.0
    if user_rank == req_rank - 1:
        return 0.4   # one level below → partial
    return 0.0


def _stream_match(user_stream, required_stream):
    """Return 0-1 score for stream compatibility."""
    if required_stream is None:
        return 1.0
    compat = _STREAM_COMPAT.get(user_stream, {None})
    return 1.0 if required_stream in compat else 0.0


def _age_match(user_age, min_age, max_age):
    """Return 0-1 score based on age range."""
    if min_age is None and max_age is None:
        return 1.0
    if min_age is not None and user_age < min_age:
        return max(0.0, 1.0 - (min_age - user_age) / 5.0)
    if max_age is not None and user_age > max_age:
        return max(0.0, 1.0 - (user_age - max_age) / 5.0)
    return 1.0


def _career_align(user_stream, career_field):
    """Return 0-1 alignment between user stream and exam career field."""
    if career_field is None:
        return 0.5
    mapping = {
        'Science':     {'Engineering', 'Medical', 'Defence'},
        'Engineering': {'Engineering', 'Management'},
        'Commerce':    {'Management', 'Banking', 'Government'},
        'Arts':        {'Government', 'Railways'},
        'Medical':     {'Medical'},
    }
    fields = mapping.get(user_stream, set())
    return 1.0 if career_field in fields else 0.3


# Singleton instance
_prediction_service = None


def get_prediction_service():
    """Get or create the singleton prediction service instance"""
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService()
    return _prediction_service
