import { randomInt } from 'node:crypto';
import { expect, test } from '../../fixtures/step-settings';
import stepSettingsTemplate from '../../fixtures/templates/step-settings.json';
import { StepSettingsPage } from '../../pages/step-settings.page';

test.describe('Step settings', { tag: '@feature:step-settings' }, () => {
  test('map a trigger field into a step input with the data selector, test the step and keep its sample data after reload', async ({ page, seed, savedStepInput }) => {
    test.setTimeout(180000);
    const stepSettingsPage = new StepSettingsPage(page);
    const value = randomInt(1, 1000000);
    const flow = await seed.flow({ template: stepSettingsTemplate, publish: false });

    await test.step('Capture sample data from the webhook trigger', async () => {
      await stepSettingsPage.visitFlow(flow.flowId);
      await stepSettingsPage.openStep('trigger');
      await stepSettingsPage.testWebhookTrigger({ webhookUrl: flow.webhookUrl, value });
    });

    await test.step('Map the query value into the code input with the data selector', async () => {
      await stepSettingsPage.openStep('step_1');
      await stepSettingsPage.mapFromDataSelector({ input: 'Value', stepName: 'trigger', keys: ['queryParams', 'value'] });
      await expect
        .poll(() => savedStepInput({ flowId: flow.flowId, stepName: 'step_1' }))
        .toEqual({ value: "{{trigger['output']['queryParams']['value']}}" });
    });

    await test.step('Test the step and see the mapped value in its output', async () => {
      await stepSettingsPage.testStep();
      await stepSettingsPage.expectStepOutput({ key: 'value', value: String(value) });
    });

    await test.step('Reload the page and see the same sample data', async () => {
      await page.reload();
      await stepSettingsPage.openStep('step_1');
      await stepSettingsPage.expectTestedSuccessfully();
      await stepSettingsPage.expectStepOutput({ key: 'value', value: String(value) });
    });
  });

  test('a formula in an input gives the expected value in the test output', async ({ page, seed, savedStepInput }) => {
    test.setTimeout(120000);
    const stepSettingsPage = new StepSettingsPage(page);
    const flow = await seed.flow({ template: stepSettingsTemplate, publish: false });

    await test.step('Put an uppercase formula in the code input', async () => {
      await stepSettingsPage.visitFlow(flow.flowId);
      await stepSettingsPage.openStep('step_1');
      await stepSettingsPage.insertFormula({ input: 'Value', functionName: 'uppercase' });
      await stepSettingsPage.typeInFocusedInput('acme inc');
      await stepSettingsPage.expectFormulaPreview('ACME INC');
      await expect
        .poll(async () => String((await savedStepInput({ flowId: flow.flowId, stepName: 'step_1' }))?.value))
        .toContain('acme inc');
    });

    await test.step('Test the step and see the formula result in its output', async () => {
      await stepSettingsPage.testStep();
      await stepSettingsPage.expectStepOutput({ key: 'value', value: 'ACME INC' });
    });
  });

  test('an input with a broken formula shows an error', { tag: '@surface' }, async ({ page, seed }) => {
    test.setTimeout(120000);
    const stepSettingsPage = new StepSettingsPage(page);
    const flow = await seed.flow({ template: stepSettingsTemplate, publish: false });

    await test.step('Put a word into a number formula in the code input', async () => {
      await stepSettingsPage.visitFlow(flow.flowId);
      await stepSettingsPage.openStep('step_1');
      await stepSettingsPage.insertFormula({ input: 'Value', functionName: 'absolute' });
      await stepSettingsPage.typeInFocusedInput('acme');
    });

    await test.step('See the type error under the input', async () => {
      await stepSettingsPage.expectFormulaError('Value 1 of absolute() should be a number');
    });
  });
});
