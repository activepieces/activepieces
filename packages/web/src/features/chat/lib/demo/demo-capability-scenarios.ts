import { isObject } from '@activepieces/core-utils';

import { platformApi } from '@/api/platforms-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import { chatDemo } from './chat-demo';
import type { DemoContext } from './demo-backend';
import type { DemoScenario } from './demo-scenarios';

async function playSecretRequest(ctx: DemoContext): Promise<void> {
  await ctx.text(
    'I need your OpenAI API key for that. Paste it in the secure card below. It goes straight to your AI settings and I never see it.',
  );
  const decision = await ctx.display({
    name: 'ap_request_secret',
    input: openAiRequest({
      provider: 'openai',
      title: 'OpenAI API key',
      hint: 'Starts with sk-. In this demo, a key that contains "bad" is rejected.',
    }),
    output: (payload) => secretOutput({ ctx, payload, label: 'OpenAI' }),
  });
  if (!decision.approved || decision.payload?.saved !== true) {
    await ctx.text(
      'No problem. Ask me again whenever you want to connect OpenAI.',
    );
    return;
  }
  await ctx.text(
    'Saved. Your OpenAI key is connected, so I can use its models from now on.',
  );
}

async function playSecretExpired(ctx: DemoContext): Promise<void> {
  await ctx.text(
    'I need your Anthropic API key. This demo request times out after 12 seconds, so you can try saving it late.',
  );
  const decision = await ctx.display({
    name: 'ap_request_secret',
    input: openAiRequest({
      provider: 'anthropic',
      title: 'Anthropic API key',
      hint: 'Starts with sk-ant-.',
    }),
    output: (payload) => secretOutput({ ctx, payload, label: 'Anthropic' }),
    timeoutMs: SECRET_TIMEOUT_MS,
  });
  if (decision.timedOut) {
    await ctx.text(
      'The request timed out. You can still save the key in the card, and I will pick it up.',
    );
    return;
  }
  await ctx.text(
    decision.payload?.saved === true
      ? 'Saved. Your Anthropic key is connected.'
      : 'Okay, I did not save anything.',
  );
}

async function playLateSaveAck(ctx: DemoContext): Promise<void> {
  await ctx.wait(300);
  await ctx.text(
    'Thanks. I can see the new Anthropic key now, so we can carry on.',
  );
}

async function playRename(ctx: DemoContext): Promise<void> {
  const platformId = requireDemoPlatform();
  const current = await platformApi.getCurrentPlatform();
  await ctx.tool({
    name: 'ap_get_settings',
    input: { scope: 'platform', section: 'general' },
    output: { values: { name: current.name }, editable: ['name'] },
    ms: 400,
  });
  await approveRename({
    ctx,
    platformId,
    target: RENAME_TARGET,
    before: current.name,
    conflict: false,
  });
}

async function playRenameConflict(ctx: DemoContext): Promise<void> {
  const platformId = requireDemoPlatform();
  const stale = 'Activepieces Demo';
  await ctx.tool({
    name: 'ap_get_settings',
    input: { scope: 'platform', section: 'general' },
    output: { values: { name: stale }, editable: ['name'] },
    ms: 400,
  });
  const preview = renamePreview({
    target: CONFLICT_TARGET,
    before: stale,
    conflict: false,
  });
  const first = await ctx.approval({
    name: 'ap_update_settings',
    input: preview.input,
    preview,
  });
  if (!first.approved) {
    ctx.deny(first.toolCallId);
    await ctx.text('Okay, I left the platform name as it is.');
    return;
  }
  const current = await platformApi.getCurrentPlatform();
  ctx.complete(first.toolCallId, {
    content: [
      {
        type: 'text',
        text: `❌ Conflict: the platform name is now "${current.name}".`,
      },
    ],
    current: { name: current.name },
    _meta: {
      apResource: {
        v: 1,
        kind: 'platform-settings',
        id: 'general',
        op: 'update',
        outcome: 'failed',
        label: 'General',
        error: {
          code: 'conflict',
          message: 'The value changed since it was read.',
        },
      },
    },
  });
  await ctx.text(
    `The platform name changed since I checked. It is now "${current.name}". Do you still want to rename it to ${CONFLICT_TARGET}?`,
  );
  await approveRename({
    ctx,
    platformId,
    target: CONFLICT_TARGET,
    before: current.name,
    conflict: true,
  });
}

async function approveRename({
  ctx,
  platformId,
  target,
  before,
  conflict,
}: {
  ctx: DemoContext;
  platformId: string;
  target: string;
  before: string;
  conflict: boolean;
}): Promise<void> {
  const preview = renamePreview({ target, before, conflict });
  const decision = await ctx.approval({
    name: 'ap_update_settings',
    input: preview.input,
    preview,
  });
  if (!decision.approved) {
    ctx.deny(decision.toolCallId);
    await ctx.text('Okay, I left the platform name as it is.');
    return;
  }
  try {
    await platformApi.update({ name: target }, platformId);
  } catch (error) {
    ctx.complete(decision.toolCallId, {
      content: [{ type: 'text', text: '❌ Could not rename the platform.' }],
      isError: true,
    });
    return ctx.fail(
      `Demo write failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  ctx.complete(decision.toolCallId, {
    content: [{ type: 'text', text: `✅ Platform renamed to "${target}".` }],
    _meta: {
      apResource: {
        v: 1,
        kind: 'platform-settings',
        id: 'general',
        op: 'update',
        outcome: 'applied',
        label: 'General',
        changes: [{ key: NAME_FIELD, before, after: target }],
      },
    },
  });
  await ctx.text(`Done. The platform is now called ${target}.`);
}

async function playInvite(ctx: DemoContext): Promise<void> {
  const input = { email: 'sam@acme.com', role: 'ADMIN' };
  const preview = {
    pieceName: '',
    actionName: 'ap_invite_member',
    actionDisplayName: 'Invite a platform member',
    input,
    isBatch: false,
  };
  const decision = await ctx.approval({
    name: 'ap_invite_member',
    input,
    preview,
  });
  if (!decision.approved) {
    ctx.deny(decision.toolCallId);
    await ctx.text('Okay, I did not invite anyone.');
    return;
  }
  ctx.complete(decision.toolCallId, {
    content: [{ type: 'text', text: '✅ Invitation sent to sam@acme.com.' }],
    _meta: {
      apResource: {
        v: 1,
        kind: 'platform-settings',
        id: 'members',
        op: 'update',
        outcome: 'applied',
        label: 'Members',
      },
    },
  });
  await ctx.text('Sent. Sam will get an email to join as an admin.');
}

async function playOpenResource(ctx: DemoContext): Promise<void> {
  const projectId = authenticationSession.getProjectId();
  if (!chatDemo.isActive() || !projectId) {
    return ctx.fail('Live demo scenarios only run in demo mode');
  }
  const page = await tablesApi.list({ projectId, limit: 50 });
  const table =
    page.data.find((candidate) =>
      candidate.name.toLowerCase().includes('competitor'),
    ) ?? page.data[0];
  await ctx.tool({
    name: 'ap_list_tables',
    input: { name: 'competitor', activeTitle: 'Finding the table' },
    output: {
      content: [
        {
          type: 'text',
          text: table
            ? `${table.name} (id: ${table.id})`
            : 'No tables in this project.',
        },
      ],
    },
    ms: 400,
  });
  if (!table) {
    await ctx.text('I could not find a table to open in this project.');
    return;
  }
  const decision = await ctx.display({
    name: 'ap_open_resource',
    input: { kind: 'table', id: table.id, projectId },
    ms: 200,
    output: (payload) => openOutput({ ctx, payload }),
  });
  const payload = decision.payload ?? {};
  await ctx.text(
    payload.opened === true
      ? `Here is the ${table.name} table.`
      : `I could not open the ${table.name} table (${String(
          payload.reason ?? 'dismissed',
        )}).`,
  );
}

async function playDocs(ctx: DemoContext): Promise<void> {
  const results = [
    {
      title: 'Webhook trigger',
      url: 'https://www.activepieces.com/docs/flows/triggers/webhook',
      snippet:
        'Start a flow when another app sends an HTTP request to a unique URL.',
    },
    {
      title: 'Respond to a webhook',
      url: 'https://www.activepieces.com/docs/flows/respond-to-webhook',
      snippet: 'Return a custom response from a flow started by a webhook.',
    },
  ];
  await ctx.tool({
    name: 'ap_search_docs',
    input: { query: 'webhook trigger', activeTitle: 'Searching the docs' },
    output: { results },
    ms: 600,
  });
  await ctx.tool({
    name: 'ap_read_doc',
    input: { url: results[0].url, activeTitle: 'Reading the docs' },
    output: { content: 'A webhook trigger gives each flow a unique URL.' },
    ms: 500,
  });
  await ctx.text(
    'Each flow that starts with a **Webhook** trigger gets its own URL. When another app sends a request to it, the flow runs with the request body, headers and query as input.\n\nTo send a custom reply back to the caller, add a **Respond to webhook** step and call the synchronous URL (it ends in `/sync`).',
  );
}

async function saveSecret({
  request,
  values,
}: {
  request: { target: string };
  values: Record<string, string>;
}): Promise<{ kind: string; id: string }> {
  await new Promise((resolve) =>
    setTimeout(resolve, Math.max(300, 900 * chatDemo.speedFactor())),
  );
  if (Object.values(values).some((value) => /bad/i.test(value))) {
    throw new Error('Rejected');
  }
  return {
    kind: request.target,
    id: `${chatDemo.DEMO_ID_PREFIX}secret-${Date.now().toString(36)}`,
  };
}

function openAiRequest({
  provider,
  title,
  hint,
}: {
  provider: string;
  title: string;
  hint: string;
}): Record<string, unknown> {
  return {
    target: 'ai_provider',
    provider,
    title,
    fields: [{ name: 'apiKey', label: 'API key', type: 'password', hint }],
  };
}

function secretOutput({
  ctx,
  payload,
  label,
}: {
  ctx: DemoContext;
  payload: Record<string, unknown>;
  label: string;
}): Record<string, unknown> {
  const keys = Object.keys(payload).sort().join(',');
  const ref = isObject(payload.ref) ? payload.ref : null;
  const validSaved =
    payload.saved === true &&
    keys === 'ref,saved' &&
    ref !== null &&
    Object.keys(ref).sort().join(',') === 'id,kind';
  const validDeclined =
    payload.saved === false &&
    keys === 'reason,saved' &&
    (payload.reason === 'dismissed' || payload.reason === 'failed');
  if (!validSaved && !validDeclined) {
    return ctx.fail('The gate payload did not match the strict schema.');
  }
  return validSaved
    ? { saved: true, ref, label }
    : { saved: false, reason: payload.reason };
}

function openOutput({
  ctx,
  payload,
}: {
  ctx: DemoContext;
  payload: Record<string, unknown>;
}): Record<string, unknown> {
  const extra = Object.keys(payload).filter(
    (key) => key !== 'opened' && key !== 'reason',
  );
  if (typeof payload.opened !== 'boolean' || extra.length > 0) {
    return ctx.fail('The gate payload did not match the strict schema.');
  }
  return payload;
}

function renamePreview({
  target,
  before,
  conflict,
}: {
  target: string;
  before: string;
  conflict: boolean;
}) {
  return {
    pieceName: '',
    actionName: 'ap_update_settings',
    actionDisplayName: 'Rename the platform',
    input: { scope: 'platform', section: 'general', patch: { name: target } },
    isBatch: false,
    before: { name: before },
    conflict,
  };
}

function requireDemoPlatform(): string {
  const platformId = authenticationSession.getPlatformId();
  if (!chatDemo.isActive() || !platformId) {
    throw new Error('Live demo scenarios only run in demo mode');
  }
  return platformId;
}

const SECRET_TIMEOUT_MS = 12_000;
const RENAME_TARGET = 'Acme';
const CONFLICT_TARGET = 'Acme Labs';
const NAME_FIELD = 'platform.general.name';

const GROUP = 'Capabilities';

export const demoCapabilities: {
  scenarios: DemoScenario[];
  saveSecret: typeof saveSecret;
} = {
  scenarios: [
    {
      id: 'secret-request',
      group: GROUP,
      label: 'Secure key card (save, reject, not now)',
      prompt: 'Connect my OpenAI account',
      title: 'Connect OpenAI',
      play: playSecretRequest,
    },
    {
      id: 'secret-expired',
      group: GROUP,
      label: 'Secure key card that times out',
      prompt: 'Connect my Anthropic account',
      title: 'Connect Anthropic',
      realtime: true,
      play: playSecretExpired,
    },
    {
      id: 'secret-late-ack',
      group: GROUP,
      label: 'Reply to a late-saved key',
      prompt: 'Saved Anthropic key',
      title: 'Anthropic key',
      play: playLateSaveAck,
    },
    {
      id: 'settings-rename',
      group: GROUP,
      label: 'Rename the platform (real)',
      prompt: 'Rename the platform to Acme',
      title: 'Rename platform',
      play: playRename,
    },
    {
      id: 'settings-conflict',
      group: GROUP,
      label: 'Rename the platform with a conflict (real)',
      prompt: 'Rename the platform to Acme Labs',
      title: 'Rename platform',
      play: playRenameConflict,
    },
    {
      id: 'settings-invite',
      group: GROUP,
      label: 'Invite a member (approval)',
      prompt: 'Invite sam@acme.com as an admin',
      title: 'Invite Sam',
      play: playInvite,
    },
    {
      id: 'open-resource',
      group: GROUP,
      label: 'Open a table on request (real)',
      prompt: 'Open the competitor table',
      title: 'Competitor table',
      play: playOpenResource,
    },
    {
      id: 'docs-answer',
      group: GROUP,
      label: 'Docs answer with sources',
      prompt: 'How do webhooks work in Activepieces?',
      title: 'Webhooks',
      play: playDocs,
    },
  ],
  saveSecret,
};
