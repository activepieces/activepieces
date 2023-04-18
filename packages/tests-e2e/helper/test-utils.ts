

export async function testSignIn(page, config: { email: string, password: string, url: string }){
    await page.goto(`${config.url}/sign-in`);
    await page.getByPlaceholder('Email').click();
    await page.getByPlaceholder('Email').fill(config.email);
    await page.getByPlaceholder('Email').press('Tab');
    await page.getByPlaceholder('Password').fill(config.password);
    await page.getByPlaceholder('Password').press('Enter');
}

export type EnvironmentProp = "AP_TEST_EMAIL" | "AP_TEST_PASSWORD" | "AP_TEST_URL" | "AP_TEST_CHANNEL";

export function getEnvOrThrow(name: EnvironmentProp): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}