import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FastifyBaseLogger } from 'fastify';
import { externalJwtAuthService } from './external-jwt-auth.service';
import { system } from '../helper/system/system';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../helper/system/system');
jest.mock('jwks-rsa');
jest.mock('jsonwebtoken');
jest.mock('../platform/platform.service');
jest.mock('../project/project-service');
jest.mock('../user/user-service');
jest.mock('./user-identity/user-identity-service');
jest.mock('./authentication-utils');

const mockSystem = system as jest.Mocked<typeof system>;
const mockJwksClient = jwksClient as jest.Mocked<typeof jwksClient>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('ExternalJwtAuthService', () => {
  let mockLog: FastifyBaseLogger;
  let service: ReturnType<typeof externalJwtAuthService>;

  beforeEach(() => {
    mockLog = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
      child: jest.fn(),
    } as any;

    service = externalJwtAuthService(mockLog);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('verifyJwtToken', () => {
    beforeEach(() => {
      mockSystem.getOrThrow.mockImplementation((prop: string) => {
        switch (prop) {
          case 'IDP_ISSUER':
            return 'https://swsagent.com';
          case 'IDP_AUDIENCE':
            return 'ap-embed';
          case 'IDP_JWKS_URL':
            return 'https://swsagent.com/.well-known/jwks.json';
          default:
            return 'mock-value';
        }
      });
    });

    it('should log JWT verification attempt without exposing token', async () => {
      const mockToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLb4KSx6bFpdTaHYA';
      
      const mockClient = {
        getSigningKey: jest.fn(),
      };
      mockJwksClient.mockReturnValue(mockClient as any);
      mockClient.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => 'mock-public-key' });
      });

      mockJwt.verify.mockReturnValue({
        sub: '1234567890',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        workspace_id: 'workspace-123',
        iss: 'https://swsagent.com',
        aud: 'ap-embed',
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      } as any);

      await service.verifyJwtToken(mockToken);

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.objectContaining({
          issuer: 'https://swsagent.com',
          audience: 'ap-embed',
          jwksUrl: 'https://swsagent.com/.well-known/jwks.json',
          tokenLength: mockToken.length,
          tokenPrefix: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        }),
        'JWT verification attempt'
      );

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '1234567890',
          iss: 'https://swsagent.com',
          aud: 'ap-embed',
          workspace_id: 'workspace-123',
          email: 'test@example.com',
        }),
        'JWT verification successful'
      );
    });

    it('should log verification failure without exposing token', async () => {
      const mockToken = 'invalid-token';
      
      const mockClient = {
        getSigningKey: jest.fn(),
      };
      mockJwksClient.mockReturnValue(mockClient as any);
      mockClient.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => 'mock-public-key' });
      });

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyJwtToken(mockToken)).rejects.toThrow();

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid token',
          issuer: 'https://swsagent.com',
          audience: 'ap-embed',
          tokenLength: mockToken.length,
        }),
        'JWT verification failed'
      );
    });

    it('should log signing key retrieval failure', async () => {
      const mockToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLb4KSx6bFpdTaHYA';
      
      const mockClient = {
        getSigningKey: jest.fn(),
      };
      mockJwksClient.mockReturnValue(mockClient as any);
      mockClient.getSigningKey.mockImplementation((kid, callback) => {
        callback(new Error('Key not found'), null);
      });

      await expect(service.verifyJwtToken(mockToken)).rejects.toThrow();

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Key not found',
          kid: expect.any(String),
        }),
        'Failed to get signing key'
      );
    });
  });

  describe('authenticateUser', () => {
    it('should log authentication attempt with structured data', async () => {
      const jwtPayload = {
        sub: '1234567890',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        workspace_id: 'workspace-123',
        iss: 'https://swsagent.com',
        aud: 'ap-embed',
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      // Mock all the dependencies
      const { userService } = require('../user/user-service');
      const { platformService } = require('../platform/platform.service');
      const { projectService } = require('../project/project-service');
      const { authenticationUtils } = require('./authentication-utils');

      userService.getOneByExternalIssuerAndSubject.mockResolvedValue(null);
      userService.create.mockResolvedValue({ id: 'user-123' });
      platformService.getOneByExternalId.mockResolvedValue(null);
      platformService.create.mockResolvedValue({ id: 'platform-123', externalId: 'workspace-123' });
      projectService.create.mockResolvedValue({ id: 'project-123' });
      authenticationUtils.getProjectAndToken.mockResolvedValue({
        id: 'user-123',
        token: 'mock-token',
        projectId: 'project-123',
        platformId: 'platform-123',
      });

      const { userIdentityService } = require('./user-identity/user-identity-service');
      userIdentityService.mockReturnValue({
        getIdentityByEmail: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'identity-123' }),
      });

      await service.authenticateUser(jwtPayload);

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '1234567890',
          email: 'test@example.com',
          iss: 'https://swsagent.com',
          workspace_id: 'workspace-123',
          hasWorkspaceId: true,
        }),
        'External JWT authentication attempt'
      );

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          platformId: 'platform-123',
          projectId: 'project-123',
          isExistingUser: false,
          workspaceId: 'workspace-123',
          userIdentityId: 'identity-123',
        }),
        'External JWT authentication successful - new user created'
      );
    });
  });
});