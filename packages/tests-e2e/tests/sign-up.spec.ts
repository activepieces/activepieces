import { faker } from '@faker-js/faker'
import { test } from '@playwright/test'
import { globalConfig } from '../config'
import { authentication } from '../page/authentication'

test('Sign Up New Account', async ({ page }) => {
  const email = faker.internet.email()
  await authentication.signUp(page, {
    email: email,
    password: globalConfig.password,
  })
})
