import {
  Field,
  FieldType,
  FlowActionType,
  FlowOperationType,
  PopulatedFlow,
  Project,
  SeekPage,
  StepLocationRelativeToParent,
  Table,
} from '@activepieces/shared';

import { flowsApi } from '@/features/flows/api/flows-api';
import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { chatDemo } from './chat-demo';
import type { DemoContext } from './demo-backend';
import type { DemoScenario } from './demo-scenarios';

const LEADS = [
  {
    Name: 'Maya Chen',
    Email: 'maya@northwind.io',
    Company: 'Northwind',
    Status: 'New',
  },
  {
    Name: 'Diego Alvarez',
    Email: 'diego@acme.com',
    Company: 'Acme',
    Status: 'New',
  },
  {
    Name: 'Priya Natarajan',
    Email: 'priya@globex.com',
    Company: 'Globex',
    Status: 'New',
  },
];
const LEAD_FIELDS = ['Name', 'Email', 'Company', 'Status'] as const;

const FLOW_STEPS = [
  {
    displayName: 'Score the lead',
    code: 'export const code = async (inputs) => {\n  return { score: inputs.employees > 200 ? 90 : 60 };\n};',
  },
  {
    displayName: 'Pick an owner',
    code: "export const code = async (inputs) => {\n  return { owner: inputs.score > 80 ? 'enterprise' : 'smb' };\n};",
  },
  {
    displayName: 'Notify the owner',
    code: 'export const code = async (inputs) => {\n  return { message: `New lead for ${inputs.owner}` };\n};',
  },
];

const DEALS_FLOW_STEPS = [
  {
    displayName: 'Summarize the deal',
    code: 'export const code = async (inputs) => {\n  return { summary: `${inputs.dealName}: ${inputs.amount}` };\n};',
  },
  {
    displayName: 'Post it to #sales',
    code: "export const code = async (inputs) => {\n  return { channel: '#sales', text: inputs.summary };\n};",
  },
];
const DEALS_BUILD_STEPS = [
  { id: 'create', label: 'Create the flow' },
  { id: 'format', label: 'Write a short summary of the deal' },
  { id: 'slack', label: 'Post it to #sales in Slack' },
  { id: 'test', label: 'Test with a real deal' },
];

async function playEditTable(ctx: DemoContext): Promise<void> {
  await ctx.text(
    "I'll add this week's three new leads to your Leads table, then mark the Acme lead as qualified.",
  );
  const projectId = await requireDemoProject();

  const table = await runTool(
    ctx,
    {
      name: 'ap_list_tables',
      input: { name: 'Leads', activeTitle: 'Finding the Leads table' },
    },
    async () => {
      const found = await findTable(projectId, 'Leads');
      return {
        value: found,
        output: found
          ? { content: [{ type: 'text', text: `Leads (id: ${found.id})` }] }
          : { content: [{ type: 'text', text: 'No table named Leads' }] },
      };
    },
  );
  const leads =
    table ??
    (await runTool(
      ctx,
      {
        name: 'ap_create_table',
        input: { name: 'Leads', fields: LEAD_FIELDS.map((name) => ({ name })) },
      },
      async () => {
        const created = await tablesApi.create({ projectId, name: 'Leads' });
        return {
          value: created,
          output: {
            structuredContent: { id: created.id, name: created.name },
            content: [
              {
                type: 'text',
                text: `✅ Table "Leads" created (id: ${created.id})`,
              },
            ],
          },
        };
      },
    ));
  await ctx.wait(1200);

  const fields = await ensureFields(ctx, leads.id);
  const inserted: Record<string, string> = {};
  for (const lead of LEADS) {
    await runTool(
      ctx,
      {
        name: 'ap_insert_records',
        input: {
          tableId: leads.id,
          records: [lead],
          activeTitle: `Adding ${lead.Name}`,
          doneTitle: `Added ${lead.Name}`,
        },
        ms: 700,
      },
      async () => {
        const [record] = await recordsApi.create({
          tableId: leads.id,
          records: [
            LEAD_FIELDS.map((name) => ({
              fieldId: fields[name].id,
              value: lead[name],
            })),
          ],
        });
        inserted[lead.Name] = record.id;
        return {
          value: record,
          output: {
            content: [
              {
                type: 'text',
                text: `✅ Inserted 1 record(s). IDs: ${record.id}`,
              },
            ],
          },
        };
      },
    );
    await ctx.wait(1100);
  }

  const diego = inserted['Diego Alvarez'];
  await runTool(
    ctx,
    {
      name: 'ap_update_record',
      input: {
        tableId: leads.id,
        recordId: diego,
        fields: { Status: 'Qualified' },
        activeTitle: 'Marking Diego as qualified',
        doneTitle: 'Marked Diego as qualified',
      },
      ms: 800,
    },
    async () => {
      const record = await recordsApi.update(diego, {
        tableId: leads.id,
        cells: [{ fieldId: fields.Status.id, value: 'Qualified' }],
      });
      return {
        value: record,
        output: { content: [{ type: 'text', text: '✅ Record updated' }] },
      };
    },
  );
  await ctx.wait(500);
  await ctx.text(
    'Done. Maya, Diego and Priya are in the Leads table, and Diego (Acme) is marked **Qualified**.',
  );
}

async function playBuildFlow(ctx: DemoContext): Promise<void> {
  await ctx.text(
    "I'll build a **Lead routing** flow: score each new lead, pick an owner, and tell them.",
  );
  const projectId = await requireDemoProject();
  const flow = await runTool(
    ctx,
    {
      name: 'ap_create_flow',
      input: {
        flowName: 'Lead routing',
        activeTitle: 'Creating the flow',
        doneTitle: 'Created Lead routing',
      },
      ms: 600,
    },
    async () => {
      const created = await flowsApi.create({
        displayName: 'Lead routing',
        projectId,
      });
      return {
        value: created,
        output: {
          structuredContent: {
            flowId: created.id,
            displayName: created.version.displayName,
          },
          content: [
            {
              type: 'text',
              text: `✅ Created flow "Lead routing" (id: ${created.id})`,
            },
          ],
        },
      };
    },
  );
  await ctx.wait(2200);

  let parent = 'trigger';
  for (const [index, step] of FLOW_STEPS.entries()) {
    const name = `step_${index + 1}`;
    const parentStepName = parent;
    await runTool(
      ctx,
      {
        name: 'ap_add_step',
        input: {
          flowId: flow.id,
          parentStepName,
          stepLocationRelativeToParent: 'AFTER',
          stepType: 'CODE',
          displayName: step.displayName,
          activeTitle: `Adding “${step.displayName}”`,
          doneTitle: `Added “${step.displayName}”`,
        },
        ms: 800,
      },
      async () => {
        const updated = await flowsApi.update(flow.id, {
          type: FlowOperationType.ADD_ACTION,
          request: {
            parentStep: parentStepName,
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            action: codeAction({ name, ...step }),
          },
        });
        return { value: updated, output: stepAddedOutput(name, step) };
      },
    );
    parent = name;
    await ctx.wait(1200);
  }

  const renamed = { ...FLOW_STEPS[0], displayName: 'Score the lead (0–100)' };
  await runTool(
    ctx,
    {
      name: 'ap_update_step',
      input: {
        flowId: flow.id,
        stepName: 'step_1',
        displayName: renamed.displayName,
        activeTitle: 'Renaming the scoring step',
        doneTitle: 'Renamed the scoring step',
      },
      ms: 700,
    },
    async () => {
      const updated: PopulatedFlow = await flowsApi.update(flow.id, {
        type: FlowOperationType.UPDATE_ACTION,
        request: codeAction({ name: 'step_1', ...renamed }),
      });
      return {
        value: updated,
        output: { content: [{ type: 'text', text: '✅ Step updated' }] },
      };
    },
  );
  await ctx.wait(500);
  await ctx.text(
    'The flow has its three steps. Next, pick a trigger (for example, a new row in Leads) and publish it.',
  );
}

async function playDealsBuild({
  ctx,
  fails,
}: {
  ctx: DemoContext;
  fails: boolean;
}): Promise<void> {
  const projectId = await requireDemoProject();
  const buildId = `demo-build-${Date.now()}`;
  const flowName = 'New HubSpot deals → Slack';
  const plan = ({
    phase,
    statuses,
    flowId,
  }: {
    phase: 'detecting' | 'building' | 'testing' | 'done' | 'failed';
    statuses: Array<'pending' | 'in_progress' | 'done' | 'failed'>;
    flowId?: string;
  }) =>
    ctx.buildPlan({
      buildId,
      phase,
      flowName,
      tagline: 'Every new deal, posted to #sales',
      iconName: 'message',
      projectId,
      ...(flowId ? { flowId } : {}),
      steps: DEALS_BUILD_STEPS.map((step, i) => ({
        ...step,
        status: statuses[i],
      })),
    });

  await ctx.status('Finding the right apps');
  await ctx.tool({
    name: 'ap_research_pieces',
    input: { query: 'hubspot deals slack' },
    ms: 1200,
  });
  await ctx.text("Got it — I'll build this now.\n\n");
  plan({
    phase: 'detecting',
    statuses: ['pending', 'pending', 'pending', 'pending'],
  });
  await ctx.wait(800);
  plan({
    phase: 'building',
    statuses: ['in_progress', 'pending', 'pending', 'pending'],
  });
  const flow = await runTool(
    ctx,
    {
      name: 'ap_create_flow',
      input: {
        flowName,
        activeTitle: 'Creating the flow',
        doneTitle: `Created ${flowName}`,
      },
      ms: 600,
    },
    async () => {
      const created = await flowsApi.create({
        displayName: flowName,
        projectId,
      });
      return {
        value: created,
        output: {
          structuredContent: {
            flowId: created.id,
            displayName: created.version.displayName,
          },
          content: [
            {
              type: 'text',
              text: `✅ Created flow "${flowName}" (id: ${created.id})`,
            },
          ],
        },
      };
    },
  );
  await ctx.wait(2200);
  let parent = 'trigger';
  for (const [index, step] of DEALS_FLOW_STEPS.entries()) {
    const name = `step_${index + 1}`;
    const parentStepName = parent;
    plan({
      phase: 'building',
      statuses: DEALS_BUILD_STEPS.map((_, i) =>
        i <= index ? 'done' : i === index + 1 ? 'in_progress' : 'pending',
      ),
      flowId: flow.id,
    });
    await runTool(
      ctx,
      {
        name: 'ap_add_step',
        input: {
          flowId: flow.id,
          parentStepName,
          stepLocationRelativeToParent: 'AFTER',
          stepType: 'CODE',
          displayName: step.displayName,
          activeTitle: `Adding “${step.displayName}”`,
          doneTitle: `Added “${step.displayName}”`,
        },
        ms: 800,
      },
      async () => {
        const updated = await flowsApi.update(flow.id, {
          type: FlowOperationType.ADD_ACTION,
          request: {
            parentStep: parentStepName,
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            action: codeAction({ name, ...step }),
          },
        });
        return { value: updated, output: stepAddedOutput(name, step) };
      },
    );
    parent = name;
    await ctx.wait(1000);
  }
  plan({
    phase: 'testing',
    statuses: ['done', 'done', 'done', 'in_progress'],
    flowId: flow.id,
  });
  if (fails) {
    await ctx.tool({
      name: 'ap_test_flow',
      input: { flowId: flow.id },
      ms: 1600,
      error:
        'Slack step failed: not_in_channel — the bot is not a member of #sales.',
    });
    plan({
      phase: 'failed',
      statuses: ['done', 'done', 'done', 'failed'],
      flowId: flow.id,
    });
    await ctx.text(
      "The flow is built, but the test failed: **the Slack bot isn't in #sales**.\n\nInvite it with `/invite @Activepieces` in the channel, then tell me to test again.",
    );
    ctx.showInline({
      name: 'ap_show_quick_replies',
      input: {
        replies: ['I invited it, test again', 'Use #general instead'],
        offerRecurringAutomation: false,
      },
    });
    return;
  }
  await ctx.tool({
    name: 'ap_test_flow',
    input: { flowId: flow.id },
    ms: 1600,
  });
  plan({
    phase: 'done',
    statuses: ['done', 'done', 'done', 'done'],
    flowId: flow.id,
  });
  await ctx.text(
    'Done! Every new HubSpot deal now posts a short summary to **#sales**. The test message went through.',
  );
  ctx.showInline({
    name: 'ap_show_quick_replies',
    input: {
      replies: ['Turn it on', 'Also email me a daily digest'],
      offerRecurringAutomation: true,
    },
  });
}

async function runTool<T>(
  ctx: DemoContext,
  {
    name,
    input,
    ms = 500,
  }: { name: string; input: Record<string, unknown>; ms?: number },
  work: () => Promise<{ value: T; output: unknown }>,
): Promise<T> {
  const call = ctx.startTool({ name, input });
  await ctx.wait(ms);
  try {
    const { value, output } = await work();
    call.succeed(output);
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    call.fail(message);
    return ctx.fail(`Demo write failed: ${message}`);
  }
}

async function requireDemoProject(): Promise<string> {
  if (!chatDemo.isActive()) {
    throw new Error('Live demo scenarios only run in demo mode');
  }
  const current = authenticationSession.getProjectId();
  if (current) return current;
  const page = await api.get<SeekPage<Project>>('/v1/projects', { limit: 1 });
  const first = page.data[0]?.id;
  if (!first) throw new Error('Live demo scenarios need a project');
  return first;
}

async function findTable(
  projectId: string,
  name: string,
): Promise<Table | null> {
  const page = await tablesApi.list({ projectId, name, limit: 20 });
  return (
    page.data.find(
      (table) => table.name.toLowerCase() === name.toLowerCase(),
    ) ?? null
  );
}

async function ensureFields(
  ctx: DemoContext,
  tableId: string,
): Promise<Record<(typeof LEAD_FIELDS)[number], Field>> {
  const existing = await fieldsApi.list({ tableId });
  const byName = (name: string) =>
    existing.find((field) => field.name.toLowerCase() === name.toLowerCase());
  const fieldFor = async (name: (typeof LEAD_FIELDS)[number]) =>
    byName(name) ??
    (await runTool(
      ctx,
      {
        name: 'ap_manage_fields',
        input: { tableId, operation: 'ADD', name, type: 'TEXT' },
      },
      async () => {
        const field = await fieldsApi.create({
          tableId,
          name,
          type: FieldType.TEXT,
        });
        return {
          value: field,
          output: {
            content: [{ type: 'text', text: `✅ Field added: ${name}` }],
          },
        };
      },
    ));
  return {
    Name: await fieldFor('Name'),
    Email: await fieldFor('Email'),
    Company: await fieldFor('Company'),
    Status: await fieldFor('Status'),
  };
}

function codeAction({
  name,
  displayName,
  code,
}: {
  name: string;
  displayName: string;
  code: string;
}) {
  return {
    name,
    displayName,
    type: FlowActionType.CODE as const,
    valid: true,
    skip: false,
    settings: {
      sourceCode: { code, packageJson: '{}' },
      input: {},
      errorHandlingOptions: {
        continueOnFailure: { value: false },
        retryOnFailure: { value: false },
      },
    },
  };
}

function stepAddedOutput(name: string, step: { displayName: string }) {
  return {
    content: [
      {
        type: 'text',
        text: `✅ Added step "${step.displayName}" (${name})`,
      },
    ],
  };
}

export const demoLiveScenarios: DemoScenario[] = [
  {
    id: 'edit-table',
    group: 'Follow along',
    label: 'Edit the Leads table (real)',
    prompt: 'Add the new leads to my Leads table',
    title: 'New leads',
    realtime: true,
    play: playEditTable,
  },
  {
    id: 'build-flow',
    group: 'Follow along',
    label: 'Build a lead routing flow (real)',
    prompt: 'Build me a lead routing flow',
    title: 'Lead routing flow',
    realtime: true,
    play: playBuildFlow,
  },
];

export const demoLiveBuilds = { play: playDealsBuild };
