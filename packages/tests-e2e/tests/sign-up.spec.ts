import { test } from '@playwright/test';
import { authentication } from '../page/authentication';
import { faker } from '@faker-js/faker'
import { globalConfig } from '../config';

test('Sign Up New Account', async ({ page }) => {
    const email = faker.internet.email();
    await authentication.signUp(page, {
      email: email,
      password: globalConfig.password
    })
});
