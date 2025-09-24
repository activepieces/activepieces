import { test, expect } from '../../../fixtures';

test.describe('Authentication - Sign In', () => {
  test('should successfully sign in with existing user and redirect to flows page', async ({ page, authenticationPage, flowsPage, users }) => {
    test.setTimeout(120000);

    // First create a user via API
    const user = await users.apiSignUp();
    
    // Sign in using the authentication page method
    await authenticationPage.signIn({
      email: user.email,
      password: '12345678' // Default password from apiSignUp
    });

    // Wait for redirect to flows page
    await flowsPage.waitFor();
    
    // Verify we're not on the signin page anymore (successful signin)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/sign-in');
    expect(currentUrl).toContain('/flows');
  });
});
