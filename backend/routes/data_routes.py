"""
Data Routes — Public GET endpoints for exams and scholarships.
Returns only the fields the frontend card UI needs.
"""

from flask import Blueprint, jsonify
from models.db_models import db, Exam, Scholarship, User

data_bp = Blueprint('data', __name__, url_prefix='/api')


@data_bp.route('/stats', methods=['GET'])
def get_stats():
    """Return platform-wide statistics (total users, active scholarships)."""
    try:
        total_users = User.query.count()
        total_scholarships = Scholarship.query.filter_by(is_active=True).count()
        return jsonify({
            'success': True,
            'total_users': total_users,
            'total_scholarships': total_scholarships
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching stats: {str(e)}'
        }), 500


# ── Portal label mapping ────────────────────────────────
PORTAL_LABELS = {
    "MAHADBT":       "Apply via MAHADBT",
    "NSP":           "Apply via NSP Portal",
    "PRIVATE":       "Apply on Official Website",
    "NGO":           "Apply on NGO Website",
    "INTERNATIONAL": "Apply Internationally",
}


@data_bp.route('/exams', methods=['GET'])
def get_exams():
    """Return active exams with card-display fields only."""
    exams = Exam.query.filter_by(is_active=True).order_by(Exam.exam_date).all()
    result = []
    for e in exams:
        result.append({
            'id':                   e.id,
            'name':                 e.name,
            'description':          e.description,
            'type':                 e.exam_type,
            'date':                 e.exam_date.strftime('%Y-%m-%d') if e.exam_date else None,
            'deadline':             e.application_deadline.strftime('%Y-%m-%d') if e.application_deadline else None,
            'score':                e.max_score,
            'eligibility':          _build_eligibility_string(e),
            'required_education':   e.required_education,
            'required_stream':      e.required_stream,
            'difficulty_level':     e.difficulty_level,
            'applyLink':            e.website,
        })
    return jsonify({'success': True, 'exams': result}), 200


@data_bp.route('/scholarships', methods=['GET'])
def get_scholarships():
    """Return active scholarships with card-display fields only."""
    scholarships = Scholarship.query.filter_by(is_active=True) \
                        .order_by(Scholarship.deadline).all()
    result = []
    for s in scholarships:
        portal = getattr(s, 'portal_type', None) or _infer_portal_type(s)
        result.append({
            'id':                       s.id,
            'name':                     s.name,
            'provider':                 s.organization,
            'category':                 s.required_category or _infer_category(s),
            'amount':                   _display_amount(s),
            'incomeLimit':              _format_income(s.min_income, s.max_income),
            'qualificationRequired':    s.eligibility_criteria or _build_scholarship_qualification(s),
            'casteEligibility':         s.required_category or 'Any',
            'genderEligibility':        s.gender_eligibility or 'Any',
            'deadline':                 s.deadline.strftime('%Y-%m-%d') if s.deadline else None,
            'description':              s.description,
            'required_education':       s.required_education,
            'required_stream':          s.required_stream,
            'min_income':               s.min_income,
            'required_category':        s.required_category,
            'applyLink':                s.website,
            'portalType':               portal,
            'applyLabel':               PORTAL_LABELS.get(portal, 'Apply Now'),
        })
    return jsonify({'success': True, 'scholarships': result}), 200


# ── helper formatters ───────────────────────────────────

def _build_eligibility_string(exam):
    """Build a human-readable eligibility string from structured fields."""
    parts = []
    if exam.required_education:
        parts.append(exam.required_education)
    if exam.required_stream:
        stream_short = {'Science': 'PCM', 'Medical': 'PCB'}.get(exam.required_stream, exam.required_stream)
        parts.append(stream_short)
    if exam.min_percentage:
        parts.append(f"({int(exam.min_percentage)}% aggregate)")
    return ' '.join(parts) if parts else 'See website'


def _display_amount(s):
    """Build display string for scholarship amount."""
    if s.amount and s.amount > 0:
        return _format_amount(s.amount)
    return 'Full funding'


def _format_amount(amount):
    """Format numeric amount to ₹ string."""
    if amount is None:
        return 'Variable'
    if amount >= 100000:
        return f"₹{amount/100000:.1f}L"
    if amount >= 1000:
        return f"₹{int(amount):,}"
    return f"₹{int(amount)}"


def _format_income(min_income, max_income):
    if max_income:
        return f"₹{int(max_income):,}"
    if min_income:
        return f"₹{int(min_income):,}"
    return 'No limit'


def _infer_category(s):
    """Infer display category from scholarship fields."""
    org = (s.organization or '').lower()
    if any(k in org for k in ['ministry', 'government', 'mhrd', 'serb', 'dst', 'state']):
        return 'Government'
    if any(k in org for k in ['ngo', 'pratham', 'cry', 'action for']):
        return 'NGO'
    if any(k in org for k in ['tata', 'infosys', 'foundation', 'ramakrishna', 'mission']):
        return 'Private Foundation'
    if any(k in org for k in ['hcl', 'microsoft', 'wipro']):
        return 'Corporate CSR'
    if any(k in org for k in ['uk', 'us ', 'german', 'new zealand', 'inlaks', 'embassy', 'chevening', 'fulbright', 'daad']):
        return 'International'
    return 'General'


def _infer_portal_type(s):
    """Fallback portal_type inference when column is NULL (pre-migration rows)."""
    website = (s.website or '').lower()
    if 'mahadbt' in website:
        return 'MAHADBT'
    if 'scholarships.gov.in' in website:
        return 'NSP'
    org = (s.organization or '').lower()
    if any(k in org for k in ['ngo', 'pratham', 'cry', 'action for']):
        return 'NGO'
    if any(k in org for k in ['uk', 'us ', 'german', 'new zealand', 'inlaks', 'embassy']):
        return 'INTERNATIONAL'
    return 'PRIVATE'


def _build_scholarship_qualification(s):
    parts = []
    if s.required_education:
        parts.append(f"{s.required_education} Pass")
    if s.required_stream:
        parts.append(s.required_stream)
    if s.min_percentage:
        parts.append(f"{int(s.min_percentage)}%+ marks")
    return ', '.join(parts) if parts else 'See website'
