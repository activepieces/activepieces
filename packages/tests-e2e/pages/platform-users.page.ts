import { expect, Locator, Request, Response } from '@playwright/test';
import { BasePage } from './base';

export class PlatformUsersPage extends BasePage {
  url = '/platform/users';

  async open(): Promise<void> {
    const listed = this.page.waitForResponse(isUsersList);
    await this.visit();
    expect((await listed).status(), 'The users request failed').toBe(200);
  }

  async deactivate({ email, userId }: { email: string; userId: string }): Promise<void> {
    await this.row(email).getByTestId('platform-user-actions').click();
    const updated = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/v1/users/${userId}`);
    await this.page.getByRole('menuitem', { name: 'Deactivate', exact: true }).click();
    const response = await updated;
    expect(response.status(), `Deactivating ${email} failed: ${await response.text()}`).toBe(200);
    const user: { status: string } = await response.json();
    expect(user.status).toBe('INACTIVE');
    await expect(this.row(email)).toContainText('Deactivated');
  }

  async expectRetrySucceeds(): Promise<void> {
    const listed = this.page.waitForResponse(isUsersList);
    await this.retryAfterError();
    expect((await listed).status()).toBe(200);
    await expect(this.errorState()).toBeHidden();
  }

  emptyState(): Locator {
    return this.page.getByTestId('data-table-empty-state');
  }

  row(email: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(email, { exact: true }) });
  }
}

export class ProjectRolesPage extends BasePage {
  url = '/platform/users/roles';

  async open(): Promise<void> {
    const listed = this.page.waitForResponse(isRolesList, { timeout: LIVE_LIST_TIMEOUT_MS }).catch(() => {
      throw new Error(`The page sent no project roles request in ${LIVE_LIST_TIMEOUT_MS} ms: a plan without projectRolesEnabled shows sample data`);
    });
    await this.visit();
    expect((await listed).status(), 'The project roles request failed').toBe(200);
  }

  async openCreateDialog(): Promise<void> {
    await this.page.getByRole('button', { name: 'New role', exact: true }).click();
    await expect(this.createDialog()).toBeVisible();
  }

  async enterName(name: string): Promise<void> {
    await this.createDialog().getByTestId('project-role-name-input').fill(name);
  }

  async chooseBase(base: 'Nothing' | 'Viewer' | 'Editor'): Promise<void> {
    await this.createDialog().getByRole('button', { name: base, exact: true }).click();
  }

  async submitTakenName(name: string): Promise<void> {
    await this.enterName(name);
    const refused = this.page.waitForResponse((response) => isRoleCreate(response.request()));
    await this.createButton().click();
    expect((await refused).status(), `The server did not refuse the taken name ${name}`).toBe(409);
    await expect(this.createDialog()).toBeVisible();
  }

  async create(name: string): Promise<{ id: string; name: string }> {
    await this.enterName(name);
    const created = this.page.waitForResponse((response) => isRoleCreate(response.request()));
    await this.createButton().click();
    const response = await created;
    expect(response.status(), `Creating the role failed: ${await response.text()}`).toBe(201);
    await expect(this.createDialog()).toBeHidden();
    const role: { id: string; name: string } = await response.json();
    return { id: role.id, name: role.name };
  }

  countRoleCreates(): () => number {
    const creates: Request[] = [];
    this.page.on('request', (request) => {
      if (isRoleCreate(request)) {
        creates.push(request);
      }
    });
    return () => creates.length;
  }

  createButton(): Locator {
    return this.createDialog().getByRole('button', { name: 'Create role', exact: true });
  }

  createDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'New role' });
  }

  saveError(): Locator {
    return this.createDialog().getByRole('alert');
  }

  role(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }
}

function isUsersList(response: Response): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/v1/users';
}

function isRolesList(response: Response): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname === ROLES_PATH;
}

function isRoleCreate(request: Request): boolean {
  return request.method() === 'POST' && new URL(request.url()).pathname === ROLES_PATH;
}

const ROLES_PATH = '/api/v1/project-roles';
const LIVE_LIST_TIMEOUT_MS = 15_000;
