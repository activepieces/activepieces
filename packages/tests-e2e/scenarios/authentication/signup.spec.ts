import { test, expect } from '../../fixtures';

test.describe('Authentication - Sign Up', () => {
  test('should successfully sign up with valid data and redirect to flows page', async ({ page, authenticationPage, flowsPage }) => {
    test.setTimeout(120000);

    await authenticationPage.signUp();

    await flowsPage.waitFor();
    
    // Verify we're not on the signup page anymore (successful signup)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/sign-up');
  });
});
