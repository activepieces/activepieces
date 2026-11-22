import { randomBytes } from 'node:crypto';
import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/platform-general';
import { BrandedSignInPage, PlatformConfigurationsPage, PlatformGeneralPage } from '../../../pages/platform-general.page';

test.describe('General and configurations', { tag: ['@feature:general', '@surface', '@platform-state'] }, () => {
  test('rename the platform and set its colour and logo', async ({ page, request, platformBranding }) => {
    const name = e2eApi.uniqueName('platform');
    const color = randomColor();
    const generalPage = new PlatformGeneralPage(page);
    await generalPage.open();

    await generalPage.rename(name);
    await generalPage.setColor({ tone: 'primary', color });
    await generalPage.chooseLogo(LOGO);
    const saved = await generalPage.save();

    expect(saved).toMatchObject({ name, primaryColor: color });
    expect(saved.fullLogoUrl).not.toBe(platformBranding.before.fullLogoUrl);
    const logo = await request.get(saved.fullLogoUrl);
    expect(logo.status(), 'The uploaded logo is not served').toBe(200);
    expect(await logo.body()).toEqual(LOGO.buffer);

    await generalPage.reload();
    await expect(generalPage.nameInput()).toHaveValue(name);
    await expect(generalPage.colorValue('primary')).toHaveText(color);
    await expect(generalPage.logoPreview()).toHaveAttribute('src', saved.fullLogoUrl);
    expect(await platformBranding.read()).toMatchObject({ name, primaryColor: color, fullLogoUrl: saved.fullLogoUrl });
  });

  test('the sign-in page shows the new branding', async ({ page, browser, baseURL, platformBranding }) => {
    const generalPage = new PlatformGeneralPage(page);
    await generalPage.open();
    await generalPage.rename(e2eApi.uniqueName('platform'));
    await generalPage.setColor({ tone: 'primary', color: randomColor() });
    await generalPage.chooseLogo(LOGO);
    await generalPage.save();
    const branded = await platformBranding.read();

    const signedOut = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const signInPage = new BrandedSignInPage(await signedOut.newPage());
    await signInPage.visit();
    await expect(signInPage.page).toHaveTitle(new RegExp(`${branded.name}$`));
    await expect(signInPage.logo()).toHaveAttribute('src', branded.fullLogoUrl);
    await expect(signInPage.logo()).toHaveJSProperty('naturalWidth', LOGO_WIDTH);
    await expect.poll(() => signInPage.readAccentColor()).toBe(branded.primaryColor);
    await signedOut.close();
  });

  test('change a configuration value and it stays after reload', async ({ page, platformConfiguration }) => {
    const enabled = !platformConfiguration.before.isInfraSetupTelemetryEnabled;
    const configurationsPage = new PlatformConfigurationsPage(page);
    await configurationsPage.open();
    await expect(configurationsPage.deploymentSetup()).toBeChecked({ checked: !enabled });

    const saved = await configurationsPage.toggleDeploymentSetup();
    expect(saved.isInfraSetupTelemetryEnabled).toBe(enabled);

    await configurationsPage.reload();
    await expect(configurationsPage.deploymentSetup()).toBeChecked({ checked: enabled });
    expect(await platformConfiguration.read()).toMatchObject({ isInfraSetupTelemetryEnabled: enabled });
  });

  test('an invalid colour value shows an error', async ({ page, platformBranding }) => {
    const generalPage = new PlatformGeneralPage(page);
    await generalPage.open();
    const updates = generalPage.countPlatformUpdates();

    await generalPage.setColor({ tone: 'primary', color: '#12345' });
    await expect(generalPage.colorError('primary')).toHaveText(INVALID_COLOR_MESSAGE);
    await expect(generalPage.saveButton()).toBeDisabled();

    const color = randomColor();
    await generalPage.setColor({ tone: 'primary', color });
    await expect(generalPage.colorError('primary')).toBeHidden();
    expect(updates()).toBe(0);
    await generalPage.save();
    expect(updates()).toBe(1);
    expect(await platformBranding.read()).toMatchObject({ primaryColor: color });
  });
});

function randomColor(): string {
  return `#${randomBytes(3).toString('hex')}`;
}

const LOGO_WIDTH = 3;
const LOGO = {
  name: 'e2e-logo.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAEElEQVR4nGMQqYiCIAY4CwA0WAVlj/6u3QAAAABJRU5ErkJggg==', 'base64'),
};
const INVALID_COLOR_MESSAGE = 'Enter a color as #abc or #aabbcc';
