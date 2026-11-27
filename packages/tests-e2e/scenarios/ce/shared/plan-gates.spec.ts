import { expect, test } from '../../../fixtures';
import { PlanGatesPage } from '../../../pages/plan-gates.page';

const LOCKED_PAGES = [
  { flag: 'apiKeysEnabled', path: '/platform/api-keys', headline: 'Automate the platform from your own code' },
  { flag: 'auditLogEnabled', path: '/platform/audit-log', headline: 'See who changed which flow, and when' },
  { flag: 'embeddingEnabled', path: '/platform/embedding', headline: 'Put automations inside your own product' },
  { flag: 'eventStreamingEnabled', path: '/platform/audit-log/streaming', headline: 'Send platform events to your own tools' },
  { flag: 'globalConnectionsEnabled', path: '/platform/connections/global', headline: 'Connect an app once, use it in every project' },
  { flag: 'managePiecesEnabled', path: '/platform/pieces/piece-sets', headline: 'Choose exactly which pieces your users see' },
  { flag: 'manageTemplatesEnabled', path: '/platform/templates', headline: 'Give your teams a head start with templates' },
  { flag: 'projectRolesEnabled', path: '/platform/users/roles', headline: 'Give every person exactly the access they need' },
  { flag: 'secretManagersEnabled', path: '/platform/secret-managers', headline: 'Keep credentials in your own vault' },
];

test.describe('Plan gates', { tag: ['@feature:plan-gates', '@surface'] }, () => {
  for (const gate of LOCKED_PAGES) {
    test(`a plan without ${gate.flag} shows the upgrade state`, async ({ page }) => {
      const planGatesPage = new PlanGatesPage(page);
      const plan = await planGatesPage.openWithPlan(gate.path);

      expect(plan[gate.flag], `The CE plan has ${gate.flag} on`).toBe(false);
      await planGatesPage.expectUpgradeCard(gate.headline);
    });
  }

  test('a plan without environmentsEnabled shows the upgrade state', async ({ page, session }) => {
    const planGatesPage = new PlanGatesPage(page);
    const plan = await planGatesPage.openWithPlan(`/projects/${session.projectId}/automations`);

    expect(plan.environmentsEnabled, 'The CE plan has environmentsEnabled on').toBe(false);
    await planGatesPage.openEnvironmentSettings();
    await planGatesPage.expectUpgradeCard('Test changes before they reach production');
  });

  test('a plan without customAppearanceEnabled shows the upgrade state', async ({ page }) => {
    const planGatesPage = new PlanGatesPage(page);
    const plan = await planGatesPage.openWithPlan('/platform/general');

    expect(plan.customAppearanceEnabled, 'The CE plan has customAppearanceEnabled on').toBe(false);
    await planGatesPage.openBrandingUpgrade();
    await expect(planGatesPage.brandingUpgradeDialog()).toBeVisible();
  });

  test('a plan without workerGroupsEnabled shows the upgrade state', async ({ page }) => {
    const planGatesPage = new PlanGatesPage(page);
    const plan = await planGatesPage.openWithPlan('/platform/workers/groups');

    expect(plan.workerGroupsEnabled, 'The CE plan has workerGroupsEnabled on').toBe(false);
    await expect(planGatesPage.lockedWorkerGroups().getByRole('heading', { name: 'Worker groups need the Enterprise edition', exact: true })).toBeVisible();
  });
});
