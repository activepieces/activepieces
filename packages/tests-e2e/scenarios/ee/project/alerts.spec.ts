import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as alertsTest } from '../../../fixtures/alerts';
import { test as runsListTest } from '../../../fixtures/runs-list';
import { AlertsPage } from '../../../pages/alerts.page';

const test = mergeTests(accessTest, alertsTest, runsListTest);

test.describe('Alerts', { tag: ['@feature:alerts', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('add an alert email and it stays after reload', async ({ page, secondProject, alerts }) => {
    const receiver = alerts.newReceiver();
    const alertsPage = new AlertsPage(page);
    await alertsPage.open({ projectId: secondProject.id });

    await alertsPage.add(receiver);
    await alerts.trackStored({ session: secondProject.session, receiver });
    await expect(alertsPage.receiver(receiver)).toBeVisible();

    await alertsPage.reload();
    await expect(alertsPage.receiver(receiver)).toBeVisible();
  });

  test('an invalid email address shows an error', async ({ page, secondProject, alerts }) => {
    const alertsPage = new AlertsPage(page);
    await alertsPage.open({ projectId: secondProject.id });
    const alertCreates = alertsPage.countAlertCreates();

    await alertsPage.submit('not-an-email');
    await expect(alertsPage.emailError()).toHaveText('Please enter a valid email address');

    const receiver = alerts.newReceiver();
    await alertsPage.add(receiver);
    await alerts.trackStored({ session: secondProject.session, receiver });
    expect(alertCreates()).toBe(1);
  });

  test('a failed run sends the alert email', async ({ secondProject, alerts, runsList, mailbox }) => {
    const receiver = alerts.newReceiver();
    await alerts.add({ session: secondProject.session, receiver });

    const { runIds: [runId] } = await runsList.seedFailedRuns({ prefix: runsList.newPrefix(), count: 1, session: secondProject.session });

    const runPath = `/projects/${secondProject.id}/runs/${runId}`;
    const link = await mailbox.linkTo({ to: receiver, path: runPath });
    expect(link.pathname).toBe(runPath);
  });
});
