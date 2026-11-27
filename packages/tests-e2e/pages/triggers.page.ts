import { BuilderPage } from './builder.page';

export class TriggersPage extends BuilderPage {
  async runFlow() {
    await this.page.getByRole('button', { name: /^Run Flow/ }).click();
  }
}
