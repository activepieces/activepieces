import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { authenticationSession } from './authentication-session';

// Mock document.cookie
const mockDocument = {
  cookie: '',
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('AuthenticationSession', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockDocument.cookie = '';
    
    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getTokenFromCookie', () => {
    it('should return token from cookie when present', () => {
      mockDocument.cookie = 'ap_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.mock; other_cookie=value';
      
      const token = authenticationSession.getTokenFromCookie();
      
      expect(token).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.mock');
    });

    it('should return null when cookie is not present', () => {
      mockDocument.cookie = 'other_cookie=value; another_cookie=value2';
      
      const token = authenticationSession.getTokenFromCookie();
      
      expect(token).toBeNull();
    });

    it('should return null when no cookies are present', () => {
      mockDocument.cookie = '';
      
      const token = authenticationSession.getTokenFromCookie();
      
      expect(token).toBeNull();
    });

    it('should handle cookies with spaces', () => {
      mockDocument.cookie = ' ap_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.mock ; other_cookie=value ';
      
      const token = authenticationSession.getTokenFromCookie();
      
      expect(token).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.mock');
    });
  });

  describe('getToken', () => {
    it('should prioritize cookie token over localStorage', () => {
      mockDocument.cookie = 'ap_token=cookie-token';
      localStorage.setItem('token', 'localStorage-token');
      
      const token = authenticationSession.getToken();
      
      expect(token).toBe('cookie-token');
    });

    it('should fallback to localStorage when no cookie', () => {
      mockDocument.cookie = '';
      localStorage.setItem('token', 'localStorage-token');
      
      const token = authenticationSession.getToken();
      
      expect(token).toBe('localStorage-token');
    });

    it('should fallback to sessionStorage when no cookie and localStorage', () => {
      mockDocument.cookie = '';
      sessionStorage.setItem('token', 'sessionStorage-token');
      
      const token = authenticationSession.getToken();
      
      expect(token).toBe('sessionStorage-token');
    });

    it('should return null when no token is available', () => {
      mockDocument.cookie = '';
      
      const token = authenticationSession.getToken();
      
      expect(token).toBeNull();
    });
  });

  describe('saveResponse', () => {
    it('should save to localStorage when not embedding', () => {
      const response = {
        id: 'user-123',
        token: 'mock-token',
        projectId: 'project-123',
        platformId: 'platform-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        trackEvents: true,
        newsLetter: false,
        verified: true,
      };

      authenticationSession.saveResponse(response, false);

      expect(localStorage.getItem('token')).toBe('mock-token');
    });

    it('should save to sessionStorage when embedding', () => {
      const response = {
        id: 'user-123',
        token: 'mock-token',
        projectId: 'project-123',
        platformId: 'platform-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        trackEvents: true,
        newsLetter: false,
        verified: true,
      };

      authenticationSession.saveResponse(response, true);

      expect(sessionStorage.getItem('token')).toBe('mock-token');
    });

    it('should dispatch storage event', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      const response = {
        id: 'user-123',
        token: 'mock-token',
        projectId: 'project-123',
        platformId: 'platform-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        trackEvents: true,
        newsLetter: false,
        verified: true,
      };

      authenticationSession.saveResponse(response, false);

      expect(dispatchEventSpy).toHaveBeenCalledWith(new Event('storage'));
    });
  });

  describe('isJwtExpired', () => {
    it('should return true for null token', () => {
      const result = authenticationSession.isJwtExpired(null as any);
      expect(result).toBe(true);
    });

    it('should return true for empty token', () => {
      const result = authenticationSession.isJwtExpired('');
      expect(result).toBe(true);
    });

    it('should return true for invalid JWT', () => {
      const result = authenticationSession.isJwtExpired('invalid-jwt');
      expect(result).toBe(true);
    });

    it('should return false for valid non-expired JWT', () => {
      // Create a valid JWT that expires in 1 hour
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { 
        sub: '1234567890', 
        exp: Math.floor(Date.now() / 1000) + 3600 
      };
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `${encodedHeader}.${encodedPayload}.signature`;
      
      const result = authenticationSession.isJwtExpired(token);
      expect(result).toBe(false);
    });

    it('should return true for expired JWT', () => {
      // Create a valid JWT that expired 1 hour ago
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { 
        sub: '1234567890', 
        exp: Math.floor(Date.now() / 1000) - 3600 
      };
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `${encodedHeader}.${encodedPayload}.signature`;
      
      const result = authenticationSession.isJwtExpired(token);
      expect(result).toBe(true);
    });
  });
});
