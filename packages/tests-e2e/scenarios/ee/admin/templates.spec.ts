import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/platform-templates';
import { BuilderPage } from '../../../pages/builder.page';
import { PlatformTemplatesPage } from '../../../pages/platform-templates.page';

test.describe('Platform templates', { tag: ['@feature:ptemplates', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('create a platform template and use it in a project', async ({ page, request, session, cleanup, flowExport }) => {
    const templatesPage = new PlatformTemplatesPage(page);
    const builderPage = new BuilderPage(page);
    const templateName = e2eApi.uniqueName('template');

    const templateId = await test.step('Create the template on the platform templates page', async () => {
      await templatesPage.visit();
      await templatesPage.openCreateDialog();
      const id = await templatesPage.createTemplate({
        name: templateName,
        file: flowExport,
        onCreated: (created) => cleanup.track({ resource: 'templates', id: created }),
      });
      await expect(templatesPage.row(templateName)).toBeVisible();
      return id;
    });

    await test.step('Start a flow of the project from the template', async () => {
      const flowId = await templatesPage.useTemplateInProject({
        name: templateName,
        onCreated: (created) => cleanup.track({ resource: 'flows', id: created }),
      });
      await expect(builderPage.step('step_1')).toBeVisible();
      const flow = await e2eApi.callApi<CreatedFlow>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
      expect(flow).toMatchObject({
        projectId: session.projectId,
        templateId,
        version: {
          displayName: templateName,
          trigger: {
            settings: { pieceName: '@activepieces/piece-webhook', triggerName: 'catch_webhook' },
            nextAction: { name: 'step_1', settings: { pieceName: '@activepieces/piece-webhook', actionName: 'return_response' } },
          },
        },
      });
    });
  });

  test('a template with no name shows an error', async ({ page, cleanup, flowExport }) => {
    const templatesPage = new PlatformTemplatesPage(page);
    await templatesPage.visit();
    const templateCreates = templatesPage.countTemplateCreates();
    await templatesPage.openCreateDialog();

    await templatesPage.submitTemplate({ name: '', file: flowExport });
    await expect(templatesPage.nameError()).toHaveText('Name is required');
    await expect(templatesPage.createDialog()).toBeVisible();
    expect(templateCreates()).toBe(0);

    const templateName = e2eApi.uniqueName('template');
    await templatesPage.createTemplate({
      name: templateName,
      file: flowExport,
      onCreated: (id) => cleanup.track({ resource: 'templates', id }),
    });
    await expect(templatesPage.row(templateName)).toBeVisible();
    expect(templateCreates()).toBe(1);
  });
});

type CreatedFlow = {
  projectId: string;
  templateId: string | null;
  version: { displayName: string; trigger: unknown };
};
