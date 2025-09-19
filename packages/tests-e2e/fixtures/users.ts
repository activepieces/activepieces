import { AuthenticationResponse, UserIdentityProvider } from '@activepieces/shared';
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

