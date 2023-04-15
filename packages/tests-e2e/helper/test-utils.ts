

export async function testSignIn(page, config: { email: string, password: string, url: string }){
    await page.goto(`${config.url}/sign-in`);
    await page.getByPlaceholder('Email').click();
    await page.getByPlaceholder('Email').fill(config.email);
    await page.getByPlaceholder('Email').press('Tab');
    await page.getByPlaceholder('Password').fill(config.password);
    await page.getByPlaceholder('Password').press('Enter');
}