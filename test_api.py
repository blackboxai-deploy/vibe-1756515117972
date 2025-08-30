#!/usr/bin/env python3
import requests
import json

# Test API endpoints
BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test health endpoint"""
    print("=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_auth():
    """Test authentication"""
    print("=== Testing Authentication ===")
    
    # Test register
    register_data = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Register Status: {response.status_code}")
    print(f"Register Response: {response.json()}")
    
    if response.status_code == 201:
        token = response.json().get("access_token")
        print(f"Got token: {token[:20]}...")
        return token
    
    # Try login if register failed
    login_data = {
        "username": "admin",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.json()}")
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"Got token: {token[:20]}..." if token else "No token received")
        return token
    
    return None

def test_categories(token):
    """Test categories endpoint"""
    print("=== Testing Categories Endpoint ===")
    
    if not token:
        print("No token available for testing")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/categories", headers=headers)
    print(f"Categories Status: {response.status_code}")
    print(f"Categories Response: {response.json()}")
    print()

def main():
    test_health()
    token = test_auth()
    test_categories(token)

if __name__ == "__main__":
    main()