import { faker } from '@faker-js/faker';
import type { APIRequestContext, Page } from '@playwright/test';

export async function signUp(request: APIRequestContext, page: Page): Promise<AuthenticationResponse> {
  const signUpPayload = {
    email: faker.internet.email(),
    password: '12345678',
    firstName: 'Test',
    lastName: 'User',
    trackEvents: false,
    platformId: null,
    newsLetter: false,
    provider: UserIdentityProvider.EMAIL,
  };

  const response = await request.post('/api/v1/authentication/sign-up', {
    data: signUpPayload,
  });

  const authResponse = await response.json();
  
  await page.addInitScript((tokenValue) => {
    localStorage.setItem('token', tokenValue);
  }, authResponse.token);  
  return authResponse;
}

// cant import from shared: https://www.checklyhq.com/docs/runtimes/#why-cant-i-import-any-npm-package-or-other-3rd-party-dependencies
export enum UserIdentityProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  SAML = 'SAML',
  JWT = 'JWT',
}

export type AuthenticationResponse = {
  id: string;
  platformRole: string;
  status: string;
  externalId: string;
  platformId: string;
  verified: boolean;
  firstName: string;
  lastName: string;
  email: string;
  trackEvents: boolean;
  newsLetter: boolean;
  token: string;
  projectId: string;
}
