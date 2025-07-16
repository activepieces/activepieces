import { Page, Locator } from '@playwright/test';

export interface IPageElement {
  (page: Page, ...args: unknown[]): Locator;
}

export interface IPageAction {
  (page: Page, ...args: unknown[]): Promise<void>;
}

export interface IPageGetter {
  (page: Page, ...args: unknown[]): Locator;
}

export interface IPageObject {
  url?: string;
  getters: Record<string, IPageGetter>;
  actions: Record<string, IPageAction>;
}

export abstract class BasePage implements IPageObject {
  abstract url?: string;
  abstract getters: Record<string, IPageGetter>;
  abstract actions: Record<string, IPageAction>;

  async visit(page: Page): Promise<void> {
    if (this.url) {
      await page.goto(this.url);
    }
  }

  async waitFor(page: Page): Promise<void> {
    // Override in child classes for specific wait conditions
  }
} 