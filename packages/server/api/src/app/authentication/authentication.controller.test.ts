import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticationController } from './authentication.controller';
import { system } from '../helper/system/system';
import { externalJwtAuthService } from './external-jwt-auth.service';

// Mock dependencies
jest.mock('../helper/system/system');
jest.mock('./external-jwt-auth.service');
jest.mock('../platform/platform.service');
jest.mock('../project/project-service');
jest.mock('../user/user-service');
jest.mock('./authentication-utils');
jest.mock('../helper/application-events');

const mockSystem = system as jest.Mocked<typeof system>;
const mockExternalJwtAuthService = externalJwtAuthService as jest.MockedFunction<typeof externalJwtAuthService>;

describe('AuthenticationController - External JWT Auth', () => {
  let mockApp: Partial<FastifyInstance>;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockApp = {
      post: jest.fn(),
    };

    mockRequest = {
      headers: {},
      body: {},
      log: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
        child: jest.fn(),
      } as any,
    };

    mockReply = {
      setCookie: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();

    // Mock system.get
    mockSystem.get.mockImplementation((prop: string) => {
      switch (prop) {
        case 'SWS_EMBED_MODE':
          return 'true';
        case 'CLIENT_REAL_IP_HEADER':
          return 'x-forwarded-for';
        default:
          return 'mock-value';
      }
    });

    // Mock external JWT auth service
    mockExternalJwtAuthService.mockReturnValue({
      verifyJwtToken: jest.fn().mockResolvedValue({
        sub: '1234567890',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        workspace_id: 'workspace-123',
        iss: 'https://swsagent.com',
        aud: 'ap-embed',
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      }),
      authenticateUser: jest.fn().mockResolvedValue({
        id: 'user-123',
        token: 'mock-jwt-token',
        projectId: 'project-123',
        platformId: 'platform-123',
      }),
    });
  });

  describe('Cookie Security', () => {
    it('should set secure HTTP-only cookie with SameSite=None in embed mode', async () => {
      // Mock the app.post to capture the handler
      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      // Register the controller
      await authenticationController(mockApp as FastifyInstance);

      // Call the handler
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify cookie was set with correct security flags
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        })
      );
    });

    it('should set SameSite=lax when not in embed mode', async () => {
      // Mock system to return false for embed mode
      mockSystem.get.mockImplementation((prop: string) => {
        switch (prop) {
          case 'SWS_EMBED_MODE':
            return 'false';
          case 'CLIENT_REAL_IP_HEADER':
            return 'x-forwarded-for';
          default:
            return 'mock-value';
        }
      });

      // Mock the app.post to capture the handler
      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      // Register the controller
      await authenticationController(mockApp as FastifyInstance);

      // Call the handler
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify cookie was set with SameSite=lax
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        })
      );
    });

    it('should handle missing token gracefully', async () => {
      // Mock the app.post to capture the handler
      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      // Register the controller
      await authenticationController(mockApp as FastifyInstance);

      // Call handler without token
      mockRequest.headers = {};
      mockRequest.body = {};

      await expect(handler(mockRequest as FastifyRequest, mockReply as FastifyReply))
        .rejects.toThrow('Missing JWT token');

      // Verify no cookie was set
      expect(mockReply.setCookie).not.toHaveBeenCalled();
    });

    it('should handle token from Authorization header', async () => {
      // Mock the app.post to capture the handler
      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      // Register the controller
      await authenticationController(mockApp as FastifyInstance);

      // Call handler with token in Authorization header
      mockRequest.headers = {
        authorization: 'Bearer mock-jwt-token',
      };
      mockRequest.body = {};

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify external JWT service was called with token from header
      expect(mockExternalJwtAuthService().verifyJwtToken).toHaveBeenCalledWith('mock-jwt-token');
      expect(mockReply.setCookie).toHaveBeenCalled();
    });

    it('should handle token from request body', async () => {
      // Mock the app.post to capture the handler
      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      // Register the controller
      await authenticationController(mockApp as FastifyInstance);

      // Call handler with token in body
      mockRequest.headers = {};
      mockRequest.body = {
        token: 'mock-jwt-token',
      };

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify external JWT service was called with token from body
      expect(mockExternalJwtAuthService().verifyJwtToken).toHaveBeenCalledWith('mock-jwt-token');
      expect(mockReply.setCookie).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should configure rate limiting with IP and subject key', () => {
      // Mock the app.post to capture the options
      let options: any;
      (mockApp.post as jest.Mock).mockImplementation((route, opts, fn) => {
        if (route === '/external') {
          options = opts;
        }
      });

      // Register the controller
      authenticationController(mockApp as FastifyInstance);

      // Verify rate limiting configuration
      expect(options.config.rateLimit).toEqual({
        max: 30,
        timeWindow: '1 minute',
        keyGenerator: expect.any(Function),
      });

      // Test key generator with token
      const keyGenerator = options.config.rateLimit.keyGenerator;
      mockRequest.headers = { 'x-forwarded-for': '192.168.1.1' };
      mockRequest.body = { token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.mock' };
      
      const key = keyGenerator(mockRequest);
      expect(key).toMatch(/^192\.168\.1\.1:1234567890$/);
    });

    it('should handle rate limiting without token', () => {
      // Mock the app.post to capture the options
      let options: any;
      (mockApp.post as jest.Mock).mockImplementation((route, opts, fn) => {
        if (route === '/external') {
          options = opts;
        }
      });

      // Register the controller
      authenticationController(mockApp as FastifyInstance);

      // Test key generator without token
      const keyGenerator = options.config.rateLimit.keyGenerator;
      mockRequest.headers = { 'x-forwarded-for': '192.168.1.1' };
      mockRequest.body = {};
      
      const key = keyGenerator(mockRequest);
      expect(key).toMatch(/^192\.168\.1\.1:unknown$/);
    });
  });
});
