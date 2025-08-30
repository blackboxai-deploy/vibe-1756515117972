import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import Document, Category, DocumentTag, User, db
from auth import get_current_user, validate_file, secure_filename_custom
from config import Config

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/documents', methods=['GET'])
@jwt_required()
def get_documents():
    """Get all documents with optional filtering"""
    current_user = get_current_user()
    
    # Get query parameters
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', '').strip()
    user_id = request.args.get('user_id', type=int)
    file_type = request.args.get('file_type', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    
    # Base query
    query = Document.query
    
    # Filter by category
    if category_id:
        query = query.filter(Document.category_id == category_id)
    
    # Filter by user (admin can see all, users see only their own)
    if current_user.role != 'admin':
        query = query.filter(Document.user_id == current_user.id)
    elif user_id:
        query = query.filter(Document.user_id == user_id)
    
    # Filter by file type
    if file_type:
        query = query.filter(Document.file_type == file_type)
    
    # Search in title and description
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Document.title.ilike(search_pattern)) |
            (Document.description.ilike(search_pattern))
        )
    
    # Order by upload date (newest first)
    query = query.order_by(Document.upload_date.desc())
    
    # Paginate
    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    documents = pagination.items
    
    return jsonify({
        'documents': [doc.to_dict() for doc in documents],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200

@documents_bp.route('/documents/upload', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload a new document"""
    current_user = get_current_user()
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    category_id = request.form.get('category_id', type=int)
    tags = request.form.get('tags', '').strip()
    
    # Validate file
    is_valid, message = validate_file(file)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    # Use title or filename
    if not title:
        title = file.filename.rsplit('.', 1)[0]
    
    # Validate category
    if category_id:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
    
    try:
        # Generate unique filename
        original_filename = secure_filename_custom(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # Create upload directory if it doesn't exist
        upload_dir = Config.UPLOAD_FOLDER
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        filepath = os.path.join(upload_dir, unique_filename)
        file.save(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        # Create document record
        document = Document(
            title=title,
            filename=original_filename,
            filepath=filepath,
            file_size=file_size,
            file_type=file_extension,
            description=description,
            user_id=current_user.id,
            category_id=category_id
        )
        
        db.session.add(document)
        db.session.flush()  # Get document ID
        
        # Add tags if provided
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            for tag_name in tag_list:
                if len(tag_name) <= 50:  # Validate tag length
                    tag = DocumentTag(document_id=document.id, tag_name=tag_name)
                    db.session.add(tag)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Clean up file if database operation failed
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': 'Failed to upload document'}), 500

@documents_bp.route('/documents/<int:document_id>', methods=['GET'])
@jwt_required()
def get_document(document_id):
    """Get specific document details"""
    current_user = get_current_user()
    
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    # Check permissions
    if current_user.role != 'admin' and document.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({'document': document.to_dict()}), 200

@documents_bp.route('/documents/<int:document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Download a document"""
    current_user = get_current_user()
    
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    # Check permissions
    if current_user.role != 'admin' and document.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Check if file exists
    if not os.path.exists(document.filepath):
        return jsonify({'error': 'File not found on server'}), 404
    
    try:
        return send_file(
            document.filepath,
            as_attachment=True,
            download_name=document.filename,
            mimetype='application/octet-stream'
        )
    except Exception as e:
        return jsonify({'error': 'Failed to download file'}), 500

@documents_bp.route('/documents/<int:document_id>', methods=['PUT'])
@jwt_required()
def update_document(document_id):
    """Update document metadata"""
    current_user = get_current_user()
    
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    # Check permissions
    if current_user.role != 'admin' and document.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update fields if provided
        if 'title' in data and data['title'].strip():
            document.title = data['title'].strip()
        
        if 'description' in data:
            document.description = data['description'].strip()
        
        if 'category_id' in data:
            category_id = data['category_id']
            if category_id:
                category = Category.query.get(category_id)
                if not category:
                    return jsonify({'error': 'Invalid category'}), 400
            document.category_id = category_id
        
        # Update tags
        if 'tags' in data:
            # Remove existing tags
            DocumentTag.query.filter_by(document_id=document.id).delete()
            
            # Add new tags
            tags = data['tags']
            if isinstance(tags, str):
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            elif isinstance(tags, list):
                tag_list = [str(tag).strip() for tag in tags if str(tag).strip()]
            else:
                tag_list = []
            
            for tag_name in tag_list:
                if len(tag_name) <= 50:
                    tag = DocumentTag(document_id=document.id, tag_name=tag_name)
                    db.session.add(tag)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Document updated successfully',
            'document': document.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update document'}), 500

@documents_bp.route('/documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Delete a document"""
    current_user = get_current_user()
    
    document = Document.query.get(document_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    # Check permissions
    if current_user.role != 'admin' and document.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        # Delete file from filesystem
        if os.path.exists(document.filepath):
            os.remove(document.filepath)
        
        # Delete document from database (tags will be deleted by cascade)
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete document'}), 500

@documents_bp.route('/documents/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get document statistics"""
    current_user = get_current_user()
    
    if current_user.role == 'admin':
        total_documents = Document.query.count()
        total_size = db.session.query(db.func.sum(Document.file_size)).scalar() or 0
        total_users = User.query.count()
        total_categories = Category.query.count()
    else:
        total_documents = Document.query.filter_by(user_id=current_user.id).count()
        total_size = db.session.query(db.func.sum(Document.file_size)).filter(
            Document.user_id == current_user.id
        ).scalar() or 0
        total_users = 1
        total_categories = Category.query.count()
    
    # Format total size
    def format_size(size):
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"
    
    return jsonify({
        'total_documents': total_documents,
        'total_size': total_size,
        'total_size_formatted': format_size(total_size),
        'total_users': total_users,
        'total_categories': total_categories
    }), 200