import {
  Field,
  FieldType,
  FlowActionType,
  FlowOperationType,
  PopulatedFlow,
  StepLocationRelativeToParent,
  Table,
} from '@activepieces/shared';

import { flowsApi } from '@/features/flows/api/flows-api';
import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import { chatDemo } from './chat-demo';
import type { DemoContext } from './demo-backend';
import type { DemoScenario } from './demo-scenarios';

// Demo scenarios that edit REAL resources on this server, through the app's
// own API clients, so follow-along can be watched on the real pages. Each
// step emits the same tool-call chunks the server would (ap_insert_records,
// ap_add_step, ...), with the resource id in the input or output, and only
// then writes. Real writes refuse to run outside demo mode.

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

async function playEditTable(ctx: DemoContext): Promise<void> {
  await ctx.text(
    "I'll add this week's three new leads to your Leads table, then mark the Acme lead as qualified.",
  );
  const projectId = requireDemoProject();

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
  const projectId = requireDemoProject();
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
  // Give the builder a moment to open beside the chat.
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

// ---------------------------------------------------------------------------

// Emits the tool call, does the real write, then completes the call with the
// server-shaped output (or fails it with the error).
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

function requireDemoProject(): string {
  const projectId = authenticationSession.getProjectId();
  if (!chatDemo.isActive() || !projectId) {
    throw new Error('Live demo scenarios only run in demo mode');
  }
  return projectId;
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
  const result = {} as Record<(typeof LEAD_FIELDS)[number], Field>;
  for (const name of LEAD_FIELDS) {
    const found = byName(name);
    result[name] =
      found ??
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
  }
  return result;
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
