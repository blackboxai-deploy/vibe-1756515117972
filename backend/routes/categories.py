from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Category, db
from auth import admin_required, get_current_user

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all categories"""
    categories = Category.query.all()
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200

@categories_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new category"""
    current_user = get_current_user()
    
    # Only admin can create categories
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    color = data.get('color', '#3b82f6').strip()
    
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    
    # Check if category already exists
    if Category.query.filter_by(name=name).first():
        return jsonify({'error': 'Category already exists'}), 409
    
    # Validate color format (basic hex validation)
    if not color.startswith('#') or len(color) != 7:
        color = '#3b82f6'
    
    try:
        new_category = Category(
            name=name,
            description=description,
            color=color
        )
        
        db.session.add(new_category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': new_category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create category'}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    """Update category"""
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields if provided
    if 'name' in data:
        name = data['name'].strip()
        if name and name != category.name:
            # Check if new name already exists
            existing = Category.query.filter_by(name=name).first()
            if existing:
                return jsonify({'error': 'Category name already exists'}), 409
            category.name = name
    
    if 'description' in data:
        category.description = data['description'].strip()
    
    if 'color' in data:
        color = data['color'].strip()
        if color.startswith('#') and len(color) == 7:
            category.color = color
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update category'}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Delete category"""
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Check if category has documents
    if category.documents.count() > 0:
        return jsonify({
            'error': f'Cannot delete category. It contains {category.documents.count()} documents.'
        }), 400
    
    try:
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete category'}), 500

@categories_bp.route('/categories/<int:category_id>/documents', methods=['GET'])
@jwt_required()
def get_category_documents(category_id):
    """Get documents in a specific category"""
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    documents = category.documents.all()
    
    return jsonify({
        'category': category.to_dict(),
        'documents': [doc.to_dict() for doc in documents]
    }), 200