import {
  FlowActionType,
  FlowOperationType,
  flowStructureUtil,
} from '@activepieces/shared';

import { flowsApi } from '@/features/flows/api/flows-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import type { DemoContext } from './demo-backend';
import type { DemoScenario } from './demo-scenarios';

async function playSummaryStates(ctx: DemoContext): Promise<void> {
  await ctx.text("I'll import the leads, add a scoring step and tidy up.");
  const { tableId, flowId } = await findResources();
  await ctx.tool({
    name: 'ap_add_step',
    input: { flowId, stepName: 'step_9', displayName: 'Score the lead' },
    output: text('✅ Added step "Score the lead" (step_9)'),
    ms: 400,
  });
  await ctx.tool({
    name: 'ap_build_flow',
    input: { flowName: 'Partner sync' },
    output: {
      structuredContent: {
        flowId: 'demoOtherFlow',
        flowUrl: '/projects/demoOtherProject/flows/demoOtherFlow',
      },
      content: [
        {
          type: 'text',
          text: '✅ Flow "Partner sync" created (id: demoOtherFlow) with 2 steps, all valid.',
        },
      ],
    },
    ms: 400,
  });
  await ctx.tool({
    name: 'ap_rename_flow',
    input: { flowId: 'demoDeclinedFlow', displayName: 'Old leads cleanup' },
    output: text(
      'The user declined this change. Do not retry it; ask what they want instead.',
    ),
    ms: 400,
  });
  await ctx.tool({
    name: 'ap_create_agent',
    input: { displayName: 'Lead triage' },
    output: {
      isError: true,
      structuredContent: { agentId: 'demoAgent' },
      content: [{ type: 'text', text: '❌ Could not save the agent.' }],
    },
    ms: 400,
  });
  await ctx.tool({
    name: 'ap_rename_flow',
    input: { flowId: 'demoLockedFlow', displayName: 'Finance sync' },
    output: text('❌ Permission denied: you cannot edit flows in Finance.'),
    ms: 400,
  });
  await ctx.tool({
    name: 'ap_insert_records',
    input: {
      tableId,
      records: Array.from({ length: 6 }, (_, index) => ({
        Name: `Lead ${index + 1}`,
      })),
    },
    output: text(
      '⚠️ Inserted 4 of 6 record(s). 2 rows were skipped: missing Email.',
    ),
    ms: 400,
  });
  await ctx.text(
    'Most of it is done. Two leads had no email, and you kept the archive.',
  );
}

async function playSingleChange(ctx: DemoContext): Promise<void> {
  const { tableId } = await findResources();
  await ctx.tool({
    name: 'ap_insert_records',
    input: {
      tableId,
      records: Array.from({ length: 6 }, (_, index) => ({
        Name: `Lead ${index + 1}`,
      })),
    },
    output: text('✅ Inserted 6 record(s). IDs: a, b, c, d, e, f'),
    ms: 400,
  });
  await ctx.text('Added six leads.');
}

async function playExpiredGate(ctx: DemoContext): Promise<void> {
  await ctx.text('I need a Slack connection to post the summary.');
  await ctx.tool({
    name: 'ap_show_connection_picker',
    input: { pieceName: '@activepieces/piece-slack', displayName: 'Slack' },
    output: {
      timedOut: true,
      message: "The user hasn't responded to the Slack connection picker yet.",
    },
    ms: 400,
  });
  await ctx.text(
    "You were away, so I didn't post anything. Ask me again when you're back.",
  );
}

async function playDeleteRows(ctx: DemoContext): Promise<void> {
  await ctx.text('I will remove the last lead from the Leads table.');
  const projectId = authenticationSession.getProjectId() ?? '';
  const tables = await tablesApi.list({ projectId, name: 'Leads', limit: 5 });
  const leads = tables.data.find((table) => table.name === 'Leads');
  if (!leads)
    return ctx.fail('No Leads table. Play "Edit the Leads table" first.');
  const records = await recordsApi.list({
    tableId: leads.id,
    limit: 100,
    cursor: undefined,
  });
  const last = records.data[records.data.length - 1];
  if (!last) return ctx.fail('The Leads table is empty.');
  const call = ctx.startTool({
    name: 'ap_delete_records',
    input: { tableId: leads.id, recordIds: [last.id] },
  });
  await ctx.wait(500);
  await recordsApi.delete({ ids: [last.id], tableId: leads.id });
  call.succeed(text('✅ Deleted 1 record(s).'));
  await ctx.wait(800);
  await ctx.text('Removed it.');
}

async function playTouchFlow(ctx: DemoContext): Promise<void> {
  await ctx.text('I will tidy up the Lead routing flow.');
  const projectId = authenticationSession.getProjectId() ?? '';
  const flows = await flowsApi.list({
    projectId,
    name: 'Lead routing',
    limit: 1,
    cursor: undefined,
  });
  const flow = flows.data[0];
  if (!flow) return ctx.fail('No Lead routing flow. Build it first.');
  await ctx.wait(4000);
  const renamed = flow.version.displayName.endsWith('(v2)')
    ? 'Lead routing'
    : 'Lead routing (v2)';
  await realFlowTool(ctx, {
    name: 'ap_rename_flow',
    input: { flowId: flow.id, displayName: renamed },
    write: () =>
      flowsApi.update(flow.id, {
        type: FlowOperationType.CHANGE_NAME,
        request: { displayName: renamed },
      }),
  });
  const trigger = flow.version.trigger;
  await realFlowTool(ctx, {
    name: 'ap_update_trigger',
    input: { flowId: flow.id },
    write: () =>
      flowsApi.update(flow.id, {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: {
          ...trigger,
          displayName: trigger.displayName.endsWith('(v2)')
            ? 'Select Trigger'
            : 'Select Trigger (v2)',
        },
      }),
  });
  const step = flowStructureUtil.getStep('step_1', trigger);
  if (step && step.type === FlowActionType.CODE) {
    await realFlowTool(ctx, {
      name: 'ap_update_step',
      input: { flowId: flow.id, stepName: 'step_1' },
      write: () =>
        flowsApi.update(flow.id, {
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            ...step,
            displayName: step.displayName.endsWith('(v2)')
              ? 'Score the lead'
              : 'Score the lead (v2)',
          },
        }),
    });
  }
  await ctx.text('Renamed the flow, its trigger and the scoring step.');
}

async function realFlowTool(
  ctx: DemoContext,
  {
    name,
    input,
    write,
  }: {
    name: string;
    input: Record<string, unknown>;
    write: () => Promise<unknown>;
  },
): Promise<void> {
  const call = ctx.startTool({ name, input });
  await ctx.wait(600);
  await write();
  call.succeed(text('✅ Done'));
  await ctx.wait(1500);
}

async function findResources(): Promise<{ tableId: string; flowId: string }> {
  const projectId = authenticationSession.getProjectId() ?? '';
  const [tables, flows] = await Promise.all([
    tablesApi.list({ projectId, limit: 1 }).catch(() => null),
    flowsApi.list({ projectId, limit: 1, cursor: undefined }).catch(() => null),
  ]);
  return {
    tableId: tables?.data[0]?.id ?? 'demoTable',
    flowId: flows?.data[0]?.id ?? 'demoFlow',
  };
}

function text(value: string) {
  return { content: [{ type: 'text', text: value }] };
}

export const demoChangeScenarios: DemoScenario[] = [
  {
    id: 'summary-states',
    group: 'Follow along',
    label: 'Reply summary: every state',
    prompt: 'Import the leads and tidy up',
    title: 'Import and tidy up',
    play: playSummaryStates,
  },
  {
    id: 'summary-single',
    group: 'Follow along',
    label: 'Reply summary: one change',
    prompt: 'Add six leads',
    title: 'Six leads',
    play: playSingleChange,
  },
  {
    id: 'delete-rows',
    group: 'Follow along',
    label: 'Delete a lead (real)',
    prompt: 'Remove the last lead',
    title: 'Remove a lead',
    realtime: true,
    play: playDeleteRows,
  },
  {
    id: 'touch-flow',
    group: 'Follow along',
    label: 'Rename flow, trigger and step (real)',
    prompt: 'Tidy up the Lead routing flow',
    title: 'Tidy up Lead routing',
    realtime: true,
    play: playTouchFlow,
  },
  {
    id: 'expired-gate',
    group: 'Follow along',
    label: 'Expired request',
    prompt: 'Post the summary to Slack',
    title: 'Slack summary',
    play: playExpiredGate,
  },
];
