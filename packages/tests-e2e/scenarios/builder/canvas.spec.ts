import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession } from '../../fixtures/api';
import { expect, test } from '../../fixtures';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { BuilderPage } from '../../pages/builder.page';

test.describe('Canvas', { tag: ['@feature:canvas', '@surface'] }, () => {
  test.use({ viewport: { width: 1280, height: 1100 } });

  test('add, move, duplicate and delete a step, and the canvas keeps them after reload', async ({ page, request, session, seed }) => {
    test.setTimeout(120000);
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false });
    const builderPage = new BuilderPage(page);
    await builderPage.visitFlow(flowId);
    const outline = () => readOutline({ request, session, flowId });

    await test.step('Add a code step and a loop', async () => {
      await builderPage.addStep({ after: 'step_1', piece: 'Code', action: 'Code' });
      await builderPage.addStep({ after: 'step_2', piece: 'Loop', action: 'Loop on Items' });
      await expect.poll(outline).toBe('step_1 step_2 step_3{}');
    });

    await test.step('Move the code step into the loop', async () => {
      await builderPage.moveStep({ stepName: 'step_2', to: { parent: 'step_3', location: 'INSIDE_LOOP' } });
      await expect.poll(outline).toBe('step_1 step_3{step_2}');
    });

    await test.step('Add a router and a step inside its first branch', async () => {
      await builderPage.addStep({ after: 'step_3', piece: 'Router', action: 'Router' });
      await builderPage.addStepAt({ slot: { parent: 'step_4', location: 'INSIDE_BRANCH', branchIndex: 0 }, piece: 'Code', action: 'Code' });
      await expect.poll(outline).toBe('step_1 step_3{step_2} step_4[step_5|]');
    });

    await test.step('Duplicate the code step, then delete the copy', async () => {
      await builderPage.duplicateStep('step_2');
      await expect.poll(outline).toBe('step_1 step_3{step_2 step_6} step_4[step_5|]');
      await builderPage.deleteStep('step_6');
      await expect.poll(outline).toBe('step_1 step_3{step_2} step_4[step_5|]');
    });

    await test.step('Reload, and the canvas shows the same steps', async () => {
      await page.reload();
      for (const stepName of ['step_1', 'step_2', 'step_3', 'step_4', 'step_5']) {
        await expect(builderPage.step(stepName)).toBeVisible();
      }
      await expect(builderPage.step('step_6')).toBeHidden();
      expect(await outline()).toBe('step_1 step_3{step_2} step_4[step_5|]');
    });
  });

  test('add a note to the canvas and edit it', async ({ page, request, session, seed }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false });
    const builderPage = new BuilderPage(page);
    const firstText = e2eApi.uniqueName('note');
    const editedText = `${firstText} edited`;
    const notes = async () => (await readFlow({ request, session, flowId })).version.notes.map((note) => note.content);
    await builderPage.visitFlow(flowId);

    await builderPage.addNote(firstText);
    await expect.poll(notes).toEqual([firstText]);

    await page.reload();
    await expect(builderPage.note()).toContainText(firstText);
    await builderPage.editNote(editedText);
    await expect.poll(notes).toEqual([editedText]);

    await page.reload();
    await expect(builderPage.note()).toContainText(editedText);
  });

  test('copy steps from one flow and paste them into another', async ({ page, request, session, seed }) => {
    const marker = e2eApi.uniqueName('copied step');
    const source = await seed.flow({ template: withMarkedStep({ marker }), publish: false });
    const target = await seed.flow({ template: webhookEcho, publish: false });
    const builderPage = new BuilderPage(page);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await builderPage.visitFlow(source.flowId);
    await builderPage.copyStep('step_1');

    await builderPage.visitFlow(target.flowId);
    await builderPage.pasteAfter('trigger');
    await expect.poll(() => readOutline({ request, session, flowId: target.flowId })).toBe('step_2 step_1');

    const sourceStep = findStep({ flow: await readFlow({ request, session, flowId: source.flowId }), stepName: 'step_1' });
    const pastedStep = findStep({ flow: await readFlow({ request, session, flowId: target.flowId }), stepName: 'step_2' });
    expect(pastedStep.displayName).toBe(`${marker} Copy`);
    expect(pastedStep.settings).toMatchObject({ pieceName: sourceStep.settings.pieceName, actionName: sourceStep.settings.actionName, input: sourceStep.settings.input });
    expect(pastedStep.settings.input).toMatchObject({ fields: { body: markedBody({ marker }) } });
  });

  test('a step with an empty required input shows as invalid and blocks publish', async ({ page, request, session, seed }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false });
    const builderPage = new BuilderPage(page);
    await builderPage.visitFlow(flowId);

    await builderPage.addStep({ after: 'step_1', piece: 'Loop', action: 'Loop on Items' });
    await expect(builderPage.step('step_2')).toContainText('Incomplete');
    await expect(builderPage.publishButton()).toBeDisabled();
    await expect.poll(async () => (await readFlow({ request, session, flowId })).version.valid).toBe(false);

    await builderPage.setTextInput({ name: 'Items', value: "{{trigger['output']['body']}}" });
    await expect(builderPage.step('step_2')).not.toContainText('Incomplete');
    await builderPage.publish();
    expect((await readFlow({ request, session, flowId })).publishedVersionId).not.toBeNull();
  });
});

async function readFlow({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  return e2eApi.callApi<FlowWithDraft>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
}

async function readOutline({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  return outlineOf((await readFlow({ request, session, flowId })).version.trigger.nextAction);
}

function outlineOf(step: FlowStep | null | undefined): string {
  if (!step) {
    return '';
  }
  const loop = step.type === 'LOOP_ON_ITEMS' ? `{${outlineOf(step.firstLoopAction)}}` : '';
  const router = step.type === 'ROUTER' ? `[${(step.children ?? []).map(outlineOf).join('|')}]` : '';
  return [`${step.name}${loop}${router}`, outlineOf(step.nextAction)].filter(Boolean).join(' ');
}

function withMarkedStep({ marker }: { marker: string }) {
  const template = structuredClone(webhookEcho);
  const step = template.flows[0].trigger.nextAction;
  step.displayName = marker;
  step.settings.input.fields.body = markedBody({ marker });
  return template;
}

function markedBody({ marker }: { marker: string }): string {
  return JSON.stringify({ copiedFrom: marker });
}

function findStep({ flow, stepName }: { flow: FlowWithDraft; stepName: string }): FlowStep {
  const all = (step: FlowStep | null | undefined): FlowStep[] => (step ? [step, ...all(step.firstLoopAction), ...(step.children ?? []).flatMap(all), ...all(step.nextAction)] : []);
  const found = all(flow.version.trigger).find((step) => step.name === stepName);
  if (!found) {
    throw new Error(`Flow ${flow.id} has no step ${stepName}`);
  }
  return found;
}

type FlowStep = {
  name: string;
  type: string;
  displayName: string;
  settings: { pieceName?: string; actionName?: string; input?: unknown };
  nextAction?: FlowStep | null;
  firstLoopAction?: FlowStep | null;
  children?: (FlowStep | null)[];
};

type FlowWithDraft = {
  id: string;
  publishedVersionId: string | null;
  version: { valid: boolean; trigger: FlowStep; notes: { content: string }[] };
};
