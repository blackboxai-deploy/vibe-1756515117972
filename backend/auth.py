from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User, db

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current authenticated user"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        return User.query.get(int(current_user_id))
    except:
        return None

def validate_file(file):
    """Validate uploaded file"""
    from config import Config
    
    if not file or file.filename == '':
        return False, "No file selected"
    
    if '.' not in file.filename:
        return False, "File must have an extension"
    
    extension = file.filename.rsplit('.', 1)[1].lower()
    if extension not in Config.ALLOWED_EXTENSIONS:
        return False, f"File type not allowed. Allowed types: {', '.join(Config.ALLOWED_EXTENSIONS)}"
    
    return True, "Valid file"

def secure_filename_custom(filename):
    """Custom secure filename function"""
    import re
    import unicodedata
    
    # Remove non-ASCII characters
    filename = unicodedata.normalize('NFKD', filename)
    filename = filename.encode('ascii', 'ignore').decode('ascii')
    
    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename).strip()
    filename = re.sub(r'[-\s]+', '-', filename)
    
    return filename