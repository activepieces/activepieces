import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class PlanGatesPage extends BasePage {
  url = '/platform';

  async openWithPlan(path: string): Promise<Plan> {
    const loaded = this.page.waitForResponse(isCurrentPlatform);
    await this.page.goto(path);
    const response = await loaded;
    expect(response.status(), 'The platform request failed').toBe(200);
    const platform: { plan: Plan } = await response.json();
    return platform.plan;
  }

  async expectUpgradeCard(headline: string): Promise<void> {
    const card = this.page.getByTestId('locked-feature-card').filter({
      has: this.page.getByRole('heading', { name: headline, exact: true }),
    });
    await expect(card).toBeVisible();
    await expect(card.getByRole('link', { name: SWITCH_EDITION_LINK, exact: true })).toBeVisible();
  }

  async openEnvironmentSettings(): Promise<void> {
    await this.page.getByTestId('project-settings-button').click();
    await this.page.getByTestId('project-settings-tab-environment').click();
  }

  async openBrandingUpgrade(): Promise<void> {
    await this.page.getByRole('button', { name: 'Unlock branding', exact: true }).click();
  }

  brandingUpgradeDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Make the platform look like your own', exact: true });
  }

  lockedWorkerGroups(): Locator {
    return this.page.getByTestId('worker-groups-locked');
  }
}

function isCurrentPlatform(response: Response): boolean {
  return response.request().method() === 'GET' && /^\/api\/v1\/platforms\/[^/]+$/.test(new URL(response.url()).pathname);
}

const SWITCH_EDITION_LINK = 'How to switch to the Enterprise edition';

export type Plan = Record<string, unknown>;
