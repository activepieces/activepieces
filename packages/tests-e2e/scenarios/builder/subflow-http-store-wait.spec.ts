import { randomUUID } from 'node:crypto';
import { coreSteps, expect, test } from '../../fixtures/core-steps';
import { e2eFlows } from '../../fixtures/flows';
import httpCall from '../../fixtures/templates/http-call.json';
import storeCarry from '../../fixtures/templates/store-carry.json';
import subflowChild from '../../fixtures/templates/subflow-child.json';
import subflowParent from '../../fixtures/templates/subflow-parent.json';
import waitForWebhook from '../../fixtures/templates/wait-for-webhook.json';

test.describe('Core steps: subflow, HTTP, store and waits', { tag: '@feature:core-sub' }, () => {
  test('call a subflow and use its returned result', async ({ request, seed, flowRuns }) => {
    test.setTimeout(150000);
    const value = `e2e-${randomUUID()}`;

    const parent = await test.step('Publish a subflow and a flow that calls it', async () => {
      const child = await seed.flow({ template: subflowChild, publish: true });
      const externalId = await flowRuns.externalIdOf({ flowId: child.flowId });
      return seed.flow({ template: coreSteps.withSubflow({ template: subflowParent, externalId }), publish: true });
    });

    await test.step('Run the calling flow and see the subflow result in its step', async () => {
      await request.get(parent.webhookUrl, { params: { value } });
      const [run] = await flowRuns.succeeded({ flowId: parent.flowId, count: 1 });
      expect(run.steps.step_1.output).toEqual({ status: 'success', data: { echo: value } });
    });
  });

  test('an HTTP step calls a webhook flow of the spec and reads the response', async ({ request, seed, flowRuns }) => {
    test.setTimeout(150000);
    const value = `e2e-${randomUUID()}`;
    const echo = await e2eFlows.publishWebhookEchoFlow({ seed });
    const caller = await seed.flow({ template: httpCall, publish: true });

    await test.step('Run the flow whose HTTP step calls the webhook flow', async () => {
      await request.get(caller.webhookUrl, { params: { target: `${echo.webhookUrl}?value=${value}` } });
      const [run] = await flowRuns.succeeded({ flowId: caller.flowId, count: 1 });
      expect(run.steps.step_1.output).toMatchObject({ status: 200 });
    });

    await test.step('See the request in the run of the webhook flow', async () => {
      const [run] = await flowRuns.succeeded({ flowId: echo.flowId, count: 1 });
      expect(run.steps.trigger.output).toMatchObject({ queryParams: { value } });
    });
  });

  test('a store step keeps a value from one run to the next', async ({ request, seed, flowRuns }) => {
    test.setTimeout(150000);
    const key = `e2e-${randomUUID()}`;
    const flow = await seed.flow({ template: storeCarry, publish: true });

    await test.step('Store a value in one run', async () => {
      await request.get(flow.webhookUrl, { params: { key, value: 'first' } });
      await flowRuns.succeeded({ flowId: flow.flowId, count: 1 });
    });

    await test.step('Read that value in the next run', async () => {
      await request.get(flow.webhookUrl, { params: { key, value: 'second' } });
      const runs = await flowRuns.succeeded({ flowId: flow.flowId, count: 2 });
      expect(runs.map((run) => run.steps.step_1.output)).toEqual(['nothing stored yet', 'first']);
    });
  });

  test('a run that waits for a webhook resumes when the webhook arrives', async ({ request, seed, flowRuns }) => {
    test.setTimeout(150000);
    const value = `e2e-${randomUUID()}`;
    const flow = await seed.flow({ template: waitForWebhook, publish: true });

    const resumeUrl = await test.step('Start a run that answers and waits', async () => {
      const response = await request.get(`${flow.webhookUrl}/sync`);
      expect(await response.json()).toEqual({ waiting: true });
      const url = response.headers()['x-activepieces-resume-webhook-url'];
      expect(url, 'The response names no resume URL').toMatch(/\/sync\?/);
      return url;
    });

    await test.step('Call the resume URL without waiting for the answer, and see the run finish with the sent value', async () => {
      const response = await request.post(resumeUrl.replace('/sync?', '?'), { data: { value } });
      expect(response.ok(), `The resume call failed with ${response.status()}`).toBe(true);
      const [run] = await flowRuns.succeeded({ flowId: flow.flowId, count: 1 });
      expect(run.steps.step_1.output).toMatchObject({ body: { value } });
      expect(run.steps.step_2.output).toMatchObject({ body: { resumedWith: value } });
    });
  });
});
