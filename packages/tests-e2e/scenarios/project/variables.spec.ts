import { expect, test } from '../../fixtures/variables';
import { BuilderPage } from '../../pages/builder.page';
import { VariablesPage } from '../../pages/variables.page';

test.describe('Variables', { tag: ['@feature:variables', '@surface'] }, () => {
  test('a variable created through the form resolves in a flow run', async ({ page, seed, cleanup, variables }) => {
    test.setTimeout(180000);
    const variablesPage = new VariablesPage(page);
    const builderPage = new BuilderPage(page);
    const name = variables.uniqueName();
    const value = variables.uniqueValue();
    const flow = await seed.flow({ template: variables.echoTemplate({ variableName: null }), publish: false });

    await test.step('Create the variable through the form', async () => {
      await variablesPage.open();
      const variable = await variablesPage.create({ name, value });
      cleanup.track({ resource: 'variables', id: variable.id });
    });

    await test.step('The list shows the name, and neither the list response nor the page holds the value', async () => {
      const listed = await variablesPage.openFilteredBy({ name });
      await expect(variablesPage.row(name)).toBeVisible();
      expect(await listed.text()).not.toContain(value);
      await expect(page.getByText(value)).toHaveCount(0);
    });

    await test.step('Insert the variable from the Variables tab of the data selector, and publish', async () => {
      await page.goto(`/flows/${flow.flowId}`);
      await builderPage.openStep('step_1');
      await variablesPage.insertFromDataSelector({ input: 'Raw Body', name });
      await builderPage.publish();
    });

    await test.step('A run returns the value, and the run log shows the step input as redacted', async () => {
      await variables.expectRunReturns({ webhookUrl: flow.webhookUrl, value });
      await expect.poll(() => variables.latestStepInput({ flowId: flow.flowId }), { timeout: 60_000 }).toMatchObject({ fields: { body: '**REDACTED**' } });
    });
  });

  test('a rotated value resolves in the next run, and a deleted variable fails it', async ({ page, seed, variables }) => {
    test.setTimeout(180000);
    const variablesPage = new VariablesPage(page);
    const variable = await variables.seed({});
    const rotated = variables.uniqueValue();
    const flow = await seed.flow({ template: variables.echoTemplate({ variableName: variable.name }), publish: true });

    await test.step('Rotate the value through the form, and the variable stays after a reload', async () => {
      await variablesPage.openFilteredBy({ name: variable.name });
      await variablesPage.rotate({ name: variable.name, value: rotated });
      await variablesPage.reload();
      await expect(variablesPage.row(variable.name)).toBeVisible();
    });

    await test.step('The next run returns the rotated value', async () => {
      await variables.expectRunReturns({ webhookUrl: flow.webhookUrl, value: rotated });
    });

    await test.step('Delete the variable through the form, and it does not come back after a reload', async () => {
      await variablesPage.delete({ name: variable.name });
      await variablesPage.reload();
      await expect(variablesPage.row(variable.name)).toHaveCount(0);
    });

    await test.step('The next run fails because the variable is gone', async () => {
      await variables.expectRunFails({ flowId: flow.flowId, webhookUrl: flow.webhookUrl, variableName: variable.name });
    });
  });

  test('a duplicate variable name shows an error and saves no second variable', async ({ page, variables }) => {
    const variablesPage = new VariablesPage(page);
    const variable = await variables.seed({});

    await variablesPage.openFilteredBy({ name: variable.name });
    await variablesPage.expectCreateRefused({ name: variable.name, value: variables.uniqueValue(), message: 'Variable name already used' });

    expect(await variables.countByName({ name: variable.name })).toBe(1);
  });
});
