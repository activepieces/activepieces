/**
 * Stub types for removed @activepieces/ee-shared package
 * These are minimal type definitions to allow the UI to compile
 * after EE package removal.
 */

import { ProjectIcon } from '@activepieces/shared';

// Authentication types
export interface CreateOtpRequestBody {
  email: string;
  type: OtpType;
}

export enum OtpType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export interface ResetPasswordRequestBody {
  identityId: string;
  otp: string;
  newPassword: string;
}

export interface VerifyEmailRequestBody {
  identityId: string;
  otp: string;
}

export interface GetCurrentProjectMemberRoleQuery {
  projectId: string;
}

export interface ManagedAuthnRequestBody {
  externalAccessToken: string;
}

// Git sync types
export enum GitBranchType {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
}

// OAuth types
export interface OAuthApp {
  id: string;
  pieceName: string;
  clientId: string;
  clientSecret: string;
  platformId: string;
  created: string;
  updated: string;
}

export interface ListOAuth2AppRequest {
    cursor?: string;
    limit?: number;
}

export interface UpsertOAuth2AppRequest {
  pieceName: string;
  clientId: string;
  clientSecret: string;
}

// Project member types
export interface ProjectMemberWithUser {
  id: string;
  userId: string;
  projectId: string;
  projectRoleId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  projectRole: {
    id: string;
    name: string;
  };
  created: string;
  updated: string;
}

// Template types
export interface GetFlowTemplateRequestQuery {
  id?: string;
  versionId?: string;
}

// Platform project types
export interface CreatePlatformProjectRequest {
  displayName: string;
  externalId?: string;
}

// Helper function stub
export function isCloudPlanButNotEnterprise(_platform: unknown): boolean {
  return false;
}

// Project platform types
export interface ListProjectRequestForPlatformQueryParams {
  cursor?: string;
  limit?: number;
}

export interface UpdateProjectPlatformRequest {
  displayName?: string;
  metadata?: Record<string, unknown>;
  releasesEnabled?: boolean;
  externalId?: string;
  icon?: ProjectIcon;
  plan?: unknown;
}
