import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as variablesTest } from '../../../fixtures/variables';

const test = mergeTests(accessTest, variablesTest);

test.describe('Variables access', { tag: ['@feature:variables', '@surface'] }, () => {
  test.describe.configure({ timeout: 180_000 });

  test('a viewer cannot create or reveal a variable, and an API key cannot reveal one: the server refuses', async ({ secondProject, viewer, variables }) => {
    const variable = await variables.seed({ session: secondProject.session });
    const viewerToken = viewer.session.token;
    const apiKey = await variables.seedApiKey();

    expect(await variables.statusOf({ token: viewerToken, method: 'GET', path: '/api/v1/variables', params: { projectId: secondProject.id } }), 'The viewer cannot list the variables of its own project').toBe(200);
    expect(await variables.statusOf({
      token: viewerToken,
      method: 'POST',
      path: '/api/v1/variables',
      data: { projectId: secondProject.id, name: variables.uniqueName(), value: variables.uniqueValue() },
    })).toBe(403);
    expect(await variables.statusOf({ token: viewerToken, method: 'POST', path: `/api/v1/variables/${variable.id}/reveal` })).toBe(403);
    expect(await variables.statusOf({ token: apiKey.token, method: 'POST', path: `/api/v1/variables/${variable.id}/reveal` })).toBe(403);
    expect(await variables.reveal({ id: variable.id })).toBe(variable.value);
  });

  test('another project can neither list a variable nor resolve it in a run', async ({ session, seed, secondProject, viewer, variables }) => {
    const variable = await variables.seed({});
    const otherProjectFlow = await seed.flow({ template: variables.echoTemplate({ variableName: variable.name }), publish: true, session: secondProject.session });

    expect(await variables.statusOf({ token: viewer.session.token, method: 'GET', path: '/api/v1/variables', params: { projectId: session.projectId } })).toBe(403);
    await variables.expectRunFails({
      flowId: otherProjectFlow.flowId,
      webhookUrl: otherProjectFlow.webhookUrl,
      variableName: variable.name,
      session: secondProject.session,
    });
  });
});
