import { expect, Locator, Request } from '@playwright/test';
import { BasePage } from './base';

export class MembersPage extends BasePage {
  url = '/automations';

  async open({ projectId }: { projectId: string }): Promise<void> {
    await this.page.goto(`/projects/${projectId}/automations`);
    await this.page.getByTestId('project-members-button').click();
    await expect(this.addButton()).toBeVisible();
  }

  countInviteRequests(): () => number {
    const sent: Request[] = [];
    this.page.on('request', (request) => sent.push(request));
    return () => sent.filter((request) => request.method() === 'POST' && new URL(request.url()).pathname === INVITATIONS_PATH).length;
  }

  async startInvite(): Promise<void> {
    await this.addButton().click();
    await expect(this.inviteDialog()).toBeVisible();
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.emailInput().press('Tab');
  }

  async removeLastEmail(): Promise<void> {
    await this.emailInput().press('Backspace');
  }

  async submitInvite(): Promise<void> {
    await this.inviteDialog().getByRole('button', { name: 'Add', exact: true }).click();
  }

  async expectInviteError(message: string): Promise<void> {
    await expect(this.inviteDialog().getByText(message, { exact: true })).toBeVisible();
    await expect(this.inviteDialog()).toBeVisible();
  }

  async invite({ email, role }: { email: string; role: string }): Promise<{ id: string }> {
    await this.enterEmail(email);
    await this.inviteDialog().getByRole('combobox').click();
    await this.option(role).click();
    await expect(this.inviteDialog().getByRole('combobox')).toHaveText(role);
    const sent = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === INVITATIONS_PATH);
    await this.submitInvite();
    const response = await sent;
    expect(response.status(), `Inviting ${email} failed: ${await response.text()}`).toBe(201);
    await expect(this.inviteDialog()).toBeHidden();
    const invitation: { id: string } = await response.json();
    return { id: invitation.id };
  }

  async changeRole({ email, role }: { email: string; role: string }): Promise<void> {
    await this.roleOf(email).click();
    const saved = this.page.waitForResponse((response) => response.request().method() === 'POST' && MEMBER_PATH.test(new URL(response.url()).pathname));
    await this.option(role).click();
    const response = await saved;
    expect(response.status(), `Changing the role failed: ${await response.text()}`).toBe(200);
    await expect(this.roleOf(email)).toHaveText(role);
  }

  async removeMember(email: string): Promise<void> {
    await this.row(email).getByTestId('project-member-remove').click();
    const removed = this.page.waitForResponse((response) => response.request().method() === 'DELETE' && MEMBER_PATH.test(new URL(response.url()).pathname));
    await this.page.getByRole('dialog', { name: 'Remove Member' }).getByRole('button', { name: 'Remove', exact: true }).click();
    const response = await removed;
    expect(response.status(), `Removing the member failed: ${await response.text()}`).toBe(204);
    await expect(this.row(email)).toBeHidden();
  }

  row(email: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(email, { exact: true }) });
  }

  roleOf(email: string): Locator {
    return this.row(email).getByRole('combobox');
  }

  private addButton(): Locator {
    return this.page.getByTestId('project-members-add-button');
  }

  private inviteDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Add Members' });
  }

  private emailInput(): Locator {
    return this.inviteDialog().getByTestId('invite-user-emails');
  }

  private option(role: string): Locator {
    return this.page.getByRole('option').filter({ has: this.page.getByText(role, { exact: true }) });
  }
}

const INVITATIONS_PATH = '/api/v1/user-invitations';
const MEMBER_PATH = /^\/api\/v1\/project-members\/[^/]+$/;
