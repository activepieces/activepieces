import { expect, test } from '../../fixtures/core-steps';
import branchRouterLoop from '../../fixtures/templates/branch-router-loop.json';

test.describe('Core steps: branch, router and loop', { tag: ['@feature:core-branch', '@surface'] }, () => {
  test('a router takes the matching branch and a loop runs once per item', async ({ request, seed, flowRuns }) => {
    test.setTimeout(150000);
    const flow = await seed.flow({ template: branchRouterLoop, publish: true });

    const [big, small] = await test.step('Run the flow with a big number and three items, then a small number and one item', async () => {
      await request.get(flow.webhookUrl, { params: { n: '20', items: '1,2,3' } });
      await flowRuns.succeeded({ flowId: flow.flowId, count: 1 });
      await request.get(flow.webhookUrl, { params: { n: '5', items: '4' } });
      return flowRuns.succeeded({ flowId: flow.flowId, count: 2 });
    });

    await test.step('See each run take its branch', async () => {
      expect(big.steps.step_2?.output).toEqual({ size: 'big' });
      expect(big.steps.step_3).toBeUndefined();
      expect(small.steps.step_3?.output).toEqual({ size: 'small' });
      expect(small.steps.step_2).toBeUndefined();
    });

    await test.step('See the loop run its step once for each item', async () => {
      expect(big.steps.step_5.output).toMatchObject({
        iterations: [doubled(2), doubled(4), doubled(6)],
      });
      expect(small.steps.step_5.output).toMatchObject({ iterations: [doubled(8)] });
    });
  });
});

function doubled(value: number) {
  return { step_6: { output: { doubled: value } } };
}
