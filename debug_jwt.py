#!/usr/bin/env python3
import jwt
import requests
import json

def debug_token():
    """Debug JWT token"""
    print("=== JWT Debug Information ===")
    
    # Get token from API
    login_data = {
        "username": "admin",
        "password": "password123"
    }
    
    response = requests.post("http://localhost:5000/api/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        
        print(f"Token received: {token[:50]}...")
        
        # Decode token without verification to see contents
        try:
            decoded_unverified = jwt.decode(token, options={"verify_signature": False})
            print(f"Token payload: {json.dumps(decoded_unverified, indent=2)}")
        except Exception as e:
            print(f"Error decoding token: {e}")
        
        # Try to decode with different secrets
        secrets = [
            'dev-jwt-secret-key-12345',
            'your-secret-key-change-in-production',
            'dev-secret-key-change-in-production'
        ]
        
        for secret in secrets:
            try:
                decoded = jwt.decode(token, secret, algorithms=['HS256'])
                print(f"Successfully decoded with secret: {secret}")
                print(f"Decoded payload: {json.dumps(decoded, indent=2)}")
                break
            except Exception as e:
                print(f"Failed with secret '{secret}': {e}")
    
    else:
        print(f"Login failed: {response.json()}")

if __name__ == "__main__":
    debug_token()