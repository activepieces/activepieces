import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import formSubmit from '../../fixtures/templates/form-submit.json';
import formWait from '../../fixtures/templates/form-wait.json';
import { BuilderPage } from '../../pages/builder.page';
import { FormsPage } from '../../pages/forms.page';
import { RunsPage } from '../../pages/runs.page';

test.describe('Human Input forms', { tag: ['@feature:forms', '@surface'] }, () => {
  test('submit a form and the run gets the values', async ({ page, seed }) => {
    test.setTimeout(120000);
    const formsPage = new FormsPage(page);
    const name = `E2E ${randomUUID().slice(0, 8)}`;
    const flow = await seed.flow({ template: formSubmit, publish: true });

    await test.step('Fill the form and submit it', async () => {
      await formsPage.visitForm(flow.flowId);
      await formsPage.fillField({ key: 'fullName', value: name });
      await formsPage.submit();
    });

    await test.step('See the value in the trigger output of the run', async () => {
      await new RunsPage(page).openLatestRun({ flowId: flow.flowId, flowName: flow.flowName, status: 'Succeeded' });
      const builderPage = new BuilderPage(page);
      await builderPage.openStep('trigger');
      await builderPage.expectStepOutput({ key: 'fullName', value: name });
    });
  });

  test('a form that waits for the response shows the result of the flow', async ({ page, seed }) => {
    test.setTimeout(120000);
    const formsPage = new FormsPage(page);
    const name = `E2E ${randomUUID().slice(0, 8)}`;
    const flow = await seed.flow({ template: formWait, publish: true });

    await formsPage.visitForm(flow.flowId);
    await formsPage.fillField({ key: 'fullName', value: name });
    await formsPage.submit();
    await formsPage.expectFlowResponse(`Thanks, ${name}`);
  });

  test('submit a file and the run gets the file', async ({ page, seed }) => {
    test.setTimeout(120000);
    const formsPage = new FormsPage(page);
    const fileName = `e2e-${randomUUID().slice(0, 8)}.txt`;
    const flow = await seed.flow({ template: formSubmit, publish: true });

    await test.step('Attach a file and submit the form', async () => {
      await formsPage.visitForm(flow.flowId);
      await formsPage.fillField({ key: 'fullName', value: 'E2E file sender' });
      await formsPage.attachFile({ key: 'attachment', name: fileName, content: 'hello from the form' });
      await formsPage.submit();
    });

    await test.step('Download the file from the trigger output of the run', async () => {
      await new RunsPage(page).openLatestRun({ flowId: flow.flowId, flowName: flow.flowName, status: 'Succeeded' });
      await new BuilderPage(page).openStep('trigger');
      expect(await formsPage.downloadFileOfOpenStep()).toEqual({ name: fileName, content: 'hello from the form' });
    });
  });

  test('a required field left empty shows an error and starts no run', async ({ page, seed }) => {
    test.setTimeout(120000);
    const formsPage = new FormsPage(page);
    const flow = await seed.flow({ template: formSubmit, publish: true });
    await formsPage.visitForm(flow.flowId);
    const submissions = formsPage.countSubmissions();

    await test.step('Submit with the required field empty', async () => {
      await formsPage.clickSubmit();
      await formsPage.expectFieldError({ key: 'fullName', message: 'This field is required' });
      expect(submissions()).toBe(0);
    });

    await test.step('Fill the field and submit again', async () => {
      await formsPage.fillField({ key: 'fullName', value: 'E2E positive control' });
      await formsPage.submit();
      expect(submissions()).toBe(1);
    });
  });

  test('a form of an unpublished flow shows not found', async ({ page, seed }) => {
    const formsPage = new FormsPage(page);
    const flow = await seed.flow({ template: formSubmit, publish: false });

    await formsPage.visitForm(flow.flowId);
    await formsPage.expectNotFound("Hmm... this form isn't here");
  });
});
