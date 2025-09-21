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

describe('Embed Mode Cookie Security', () => {
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

  describe('SameSite Cookie Behavior', () => {
    it('should set SameSite=None when SWS_EMBED_MODE=true', async () => {
      // Mock system to return true for embed mode
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
      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify cookie was set with SameSite=None for cross-site embedding
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        })
      );
    });

    it('should set SameSite=lax when SWS_EMBED_MODE=false', async () => {
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
      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify cookie was set with SameSite=lax for same-site usage
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

    it('should set SameSite=lax when SWS_EMBED_MODE is not set', async () => {
      // Mock system to return undefined for embed mode
      mockSystem.get.mockImplementation((prop: string) => {
        switch (prop) {
          case 'SWS_EMBED_MODE':
            return undefined;
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
      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Verify cookie was set with SameSite=lax as default
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
  });

  describe('Cookie Security Flags', () => {
    it('should always set HttpOnly flag', async () => {
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

      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      await authenticationController(mockApp as FastifyInstance);

      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });

    it('should always set Secure flag', async () => {
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

      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      await authenticationController(mockApp as FastifyInstance);

      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          secure: true,
        })
      );
    });

    it('should set correct maxAge (7 days)', async () => {
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

      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      await authenticationController(mockApp as FastifyInstance);

      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        })
      );
    });

    it('should set path to root', async () => {
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

      let handler: any;
      (mockApp.post as jest.Mock).mockImplementation((route, options, fn) => {
        if (route === '/external') {
          handler = fn;
        }
      });

      await authenticationController(mockApp as FastifyInstance);

      mockRequest.body = { token: 'mock-jwt-token' };
      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'ap_token',
        'mock-jwt-token',
        expect.objectContaining({
          path: '/',
        })
      );
    });
  });
});
