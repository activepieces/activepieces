import { Page, Locator } from '@playwright/test';

export interface IPageElement {
  (...args: unknown[]): Locator;
}

export interface IPageAction {
  (...args: unknown[]): Promise<void>;
}

export interface IPageGetter {
  (...args: unknown[]): Locator;
}

export interface IPageObject {
  url: string;
  page: Page;
  visit(): Promise<void>;
}

export abstract class BasePage implements IPageObject {
  abstract url: string;

  constructor(public readonly page: Page) {}

  async visit(): Promise<void> {
    await this.page.goto(this.url);
  }
} 