import { expect, Locator, Request, Response } from '@playwright/test';
import type { Platform } from '../fixtures/platform-general';
import { AuthenticationPage } from './authentication.page';
import { BasePage } from './base';

export class PlatformGeneralPage extends BasePage {
  url = '/platform/general';

  async open(): Promise<void> {
    await this.visit();
    await expect(this.nameInput()).toBeEditable();
  }

  async reload(): Promise<void> {
    const loaded = this.page.waitForResponse((response) => isPlatformRead(response));
    await this.page.reload();
    expect((await loaded).status(), 'Reading the platform failed').toBe(200);
    await expect(this.nameInput()).toBeEditable();
  }

  async rename(name: string): Promise<void> {
    await this.nameInput().fill(name);
  }

  async setColor({ tone, color }: { tone: ColorTone; color: string }): Promise<void> {
    await this.page.getByTestId(`general-${tone}-color`).click();
    const hexInput = this.page.getByTestId('color-picker-hex');
    await hexInput.fill(color);
    await hexInput.press('Escape');
    await expect(hexInput).toBeHidden();
  }

  async save(): Promise<Platform> {
    const saved = this.page.waitForResponse((response) => isPlatformUpdate(response.request()));
    await this.saveButton().click();
    const response = await saved;
    expect(response.status(), 'Saving the platform failed').toBe(200);
    return response.json();
  }

  countPlatformUpdates(): () => number {
    const updates: Request[] = [];
    this.page.on('request', (request) => {
      if (isPlatformUpdate(request)) {
        updates.push(request);
      }
    });
    return () => updates.length;
  }

  nameInput(): Locator {
    return this.page.getByTestId('general-platform-name');
  }

  colorValue(tone: ColorTone): Locator {
    return this.page.getByTestId(`general-${tone}-color-value`);
  }

  colorError(tone: ColorTone): Locator {
    return this.page.getByTestId(`general-${tone}-color-error`);
  }

  saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }
}

export class PlatformConfigurationsPage extends BasePage {
  url = '/platform/configurations';

  async open(): Promise<void> {
    const loaded = this.page.waitForResponse((response) => isConfigurationRead(response));
    await this.visit();
    expect((await loaded).status(), 'Reading the platform configuration failed').toBe(200);
  }

  async reload(): Promise<void> {
    const loaded = this.page.waitForResponse((response) => isConfigurationRead(response));
    await this.page.reload();
    expect((await loaded).status(), 'Reading the platform configuration failed').toBe(200);
  }

  async toggleDeploymentSetup(): Promise<{ isInfraSetupTelemetryEnabled: boolean }> {
    await this.deploymentSetup().click();
    const saved = this.page.waitForResponse((response) => response.request().method() === 'POST' && CONFIGURATION_PATH.test(new URL(response.url()).pathname));
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await saved;
    expect(response.status(), 'Saving the platform configuration failed').toBe(200);
    return response.json();
  }

  deploymentSetup(): Locator {
    return this.page.getByTestId('configurations-deployment-setup');
  }
}

export class BrandedSignInPage extends AuthenticationPage {
  readAccentColor(): Promise<string> {
    return this.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent-light-9'));
  }
}

function isPlatformRead(response: Response): boolean {
  return response.request().method() === 'GET' && PLATFORM_PATH.test(new URL(response.url()).pathname);
}

function isPlatformUpdate(request: Request): boolean {
  return request.method() === 'POST' && PLATFORM_PATH.test(new URL(request.url()).pathname);
}

function isConfigurationRead(response: Response): boolean {
  return response.request().method() === 'GET' && CONFIGURATION_PATH.test(new URL(response.url()).pathname);
}

const PLATFORM_PATH = /^\/api\/v1\/platforms\/[^/]+$/;
const CONFIGURATION_PATH = /^\/api\/v1\/platform-configurations\/?$/;

type ColorTone = 'primary' | 'danger' | 'warning' | 'success';
