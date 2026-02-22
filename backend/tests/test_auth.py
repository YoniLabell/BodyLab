"""Tests for authentication endpoints."""
import pytest


class TestSignup:
    def test_signup_success(self, client):
        response = client.post("/api/v1/auth/signup", json={
            "email": "new@test.com",
            "password": "password123",
            "name": "New User",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "new@test.com"

    def test_signup_duplicate_email(self, client):
        payload = {"email": "dup@test.com", "password": "password123", "name": "Dup"}
        client.post("/api/v1/auth/signup", json=payload)
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 400

    def test_signup_weak_password(self, client):
        response = client.post("/api/v1/auth/signup", json={
            "email": "weak@test.com",
            "password": "short",
            "name": "Weak",
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        client.post("/api/v1/auth/signup", json={
            "email": "login@test.com",
            "password": "password123",
            "name": "Login User",
        })
        response = client.post("/api/v1/auth/login", json={
            "email": "login@test.com",
            "password": "password123",
        })
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_login_wrong_password(self, client):
        client.post("/api/v1/auth/signup", json={
            "email": "login2@test.com",
            "password": "password123",
            "name": "Login2",
        })
        response = client.post("/api/v1/auth/login", json={
            "email": "login2@test.com",
            "password": "wrongpass",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/v1/auth/login", json={
            "email": "nobody@test.com",
            "password": "password123",
        })
        assert response.status_code == 401


class TestMe:
    def test_me_unauthenticated(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_me_authenticated(self, client):
        client.post("/api/v1/auth/signup", json={
            "email": "me@test.com",
            "password": "password123",
            "name": "Me User",
        })
        # Cookie is set automatically by test client
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 200
        assert response.json()["data"]["email"] == "me@test.com"
