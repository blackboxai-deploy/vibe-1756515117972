import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Category

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Configure CORS
    CORS(app, 
         origins=Config.CORS_ORIGINS, 
         allow_headers=Config.CORS_ALLOW_HEADERS,
         methods=Config.CORS_METHODS,
         supports_credentials=True)
    
    # Import and register blueprints
    from routes.users import users_bp
    from routes.categories import categories_bp
    from routes.documents import documents_bp
    
    app.register_blueprint(users_bp, url_prefix='/api/auth')
    app.register_blueprint(categories_bp, url_prefix='/api')
    app.register_blueprint(documents_bp, url_prefix='/api')
    
    # Create tables and default data
    with app.app_context():
        db.create_all()
        
        # Create default categories if they don't exist
        default_categories = [
            {'name': 'General', 'description': 'General documents', 'color': '#6b7280'},
            {'name': 'Important', 'description': 'Important documents', 'color': '#ef4444'},
            {'name': 'Work', 'description': 'Work related documents', 'color': '#3b82f6'},
            {'name': 'Personal', 'description': 'Personal documents', 'color': '#10b981'},
            {'name': 'Archive', 'description': 'Archived documents', 'color': '#f59e0b'},
        ]
        
        for cat_data in default_categories:
            if not Category.query.filter_by(name=cat_data['name']).first():
                category = Category(**cat_data)
                db.session.add(category)
        
        db.session.commit()
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({'error': 'File too large'}), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Token is required'}), 401
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Document Management System API is running'
        }), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Create upload directory
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)