import { randomBytes } from 'node:crypto';
import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/platform-general';
import { BrandedSignInPage, PlatformConfigurationsPage, PlatformGeneralPage } from '../../../pages/platform-general.page';

test.describe('General and configurations', { tag: ['@feature:general', '@surface', '@platform-state'] }, () => {
  test('rename the platform and set its colour', async ({ page, platformBranding }) => {
    const name = e2eApi.uniqueName('platform');
    const color = randomColor();
    const generalPage = new PlatformGeneralPage(page);
    await generalPage.open();

    await generalPage.rename(name);
    await generalPage.setColor({ tone: 'primary', color });
    expect(await generalPage.save()).toMatchObject({ name, primaryColor: color });

    await generalPage.reload();
    await expect(generalPage.nameInput()).toHaveValue(name);
    await expect(generalPage.colorValue('primary')).toHaveText(color);
    expect(await platformBranding.read()).toMatchObject({ name, primaryColor: color });
  });

  test('the sign-in page shows the new branding', async ({ page, browser, baseURL, platformBranding }) => {
    const generalPage = new PlatformGeneralPage(page);
    await generalPage.open();
    await generalPage.rename(e2eApi.uniqueName('platform'));
    await generalPage.setColor({ tone: 'primary', color: randomColor() });
    await generalPage.save();
    const branded = await platformBranding.read();

    const signedOut = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const signInPage = new BrandedSignInPage(await signedOut.newPage());
    await signInPage.visit();
    await expect(signInPage.page).toHaveTitle(new RegExp(`${branded.name}$`));
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

const INVALID_COLOR_MESSAGE = 'Enter a color as #abc or #aabbcc';
