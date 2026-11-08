import {
  BatchProgressData,
  PersistedAgentMessage,
  PersistedAgentPart,
  PersistedAgentPartType,
  PersistedAgentRole,
  PersistedToolCallStatus,
  SubagentActivity,
  subagentProgressId,
} from '@activepieces/shared';

import { authenticationSession } from '@/lib/authentication-session';

import { chatDemo } from './chat-demo';
import type { DemoContext } from './demo-backend';
import { demoCapabilities } from './demo-capability-scenarios';
import { demoChangeScenarios } from './demo-change-scenarios';
import { demoLiveBuilds, demoLiveScenarios } from './demo-live-scenarios';

const SHORT_REPLY =
  "I can build automations, run actions in your apps, and answer questions about your flows and runs. Tell me the busywork you want gone and I'll take it from there.";

const MARKDOWN_REPLY = `Webhooks let one app **push** events to another the moment they happen, instead of the other app *polling* for changes.

## How it works

1. You give the sending app a URL (the webhook endpoint).
2. When something happens — a payment, a form submission — it sends an HTTP \`POST\` to that URL.
3. Your flow starts with that payload as its input.

### Webhook vs. polling

| | Webhook | Polling |
|---|---|---|
| Speed | Instant | Every 1–15 min |
| Load | One request per event | Constant checks |
| Setup | Needs a public URL | Works anywhere |
| Missed events | Retries on failure | Can skip between checks |

### A quick example

Here is what Stripe sends when a payment succeeds:

\`\`\`json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": { "id": "pi_3N", "amount": 4900, "currency": "usd" }
  }
}
\`\`\`

And a small code step that turns it into a Slack message:

\`\`\`typescript
export const code = async (inputs: { amount: number; currency: string }) => {
  const dollars = (inputs.amount / 100).toFixed(2);
  return { text: \`💸 New payment: \${dollars} \${inputs.currency.toUpperCase()}\` };
};
\`\`\`

> **Tip:** keep the webhook step fast and do heavy work in later steps, so the sender never times out.

### Good to know

- Most apps **sign** their webhooks; check the signature to be safe.
  - Stripe: \`Stripe-Signature\` header
  - GitHub: \`X-Hub-Signature-256\` header
- Use the ~~old~~ *test* button in the trigger to capture a sample payload.
- Read more in the [Activepieces docs](https://www.activepieces.com/docs) or the [Stripe webhook guide](https://stripe.com/docs/webhooks).

---

Want me to set up a Stripe → Slack flow like this one?`;

const DOCUMENT_REPLY = `# Failed payments runbook

**Owner:** Billing ops · **Last reviewed:** this week

## When this applies

Use this runbook when a customer's card payment fails and the automatic retry has not recovered it within 24 hours.

## Steps

1. **Check the reason** in Stripe (insufficient funds, expired card, fraud block).
2. **Email the customer** using the *Payment failed* template. Include the update-card link.
3. **Wait 3 days.** If still unpaid, send the second reminder.
4. **Escalate** to the account owner on day 7.
5. **Pause the account** on day 14 — never delete data.

## Templates

| Day | Template | Channel |
|---|---|---|
| 0 | Payment failed | Email |
| 3 | Friendly reminder | Email |
| 7 | Account owner heads-up | Slack DM |
| 14 | Account paused | Email |

## Don'ts

- Don't retry a card blocked for fraud.
- Don't share invoice PDFs in public channels.
`;

const SLOW_REPLY = `Here is a step-by-step plan to move off Zapier without breaking anything.

First, list every zap and sort them by how many tasks they ran last month. Start with the busiest five; they give you the most value and the most risk, so they deserve the most care. For each one, rebuild it as a flow, run it side by side with the zap for a few days, and compare the results. Only turn the zap off once the outputs match.

Second, move connections before flows. Reconnect each app once in Activepieces so every new flow can reuse it. This is also a good moment to clean up old accounts nobody uses.

Third, keep a short migration log: zap name, new flow link, date switched, and who checked it. It sounds boring, but it is what saves you when someone asks why a report stopped arriving.

Finally, once everything is moved, export your Zapier history for your records and cancel the plan at the end of the billing cycle.`;

function svgDataUrl(title: string): string {
  const bars = [62, 88, 45, 120, 96, 140]
    .map(
      (h, i) =>
        `<rect x="${60 + i * 90}" y="${330 - h * 2}" width="56" height="${
          h * 2
        }" rx="8" fill="url(#g)"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#3dd6c6"/></linearGradient></defs><rect width="640" height="400" fill="#f7f7fb"/><text x="40" y="52" font-family="Inter, sans-serif" font-size="24" font-weight="600" fill="#1b1b2f">${title}</text>${bars}<line x1="40" y1="330" x2="600" y2="330" stroke="#c9c9d6"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const CLEAN_CSV = `name,email,company,score
Ada Lovelace,ada@analytical.io,Analytical Engines,92
Grace Hopper,grace@cobol.dev,Navy Labs,88
Alan Turing,alan@bletchley.uk,Bletchley Park,85
Katherine Johnson,kj@nasa.gov,NASA,97
Linus Torvalds,linus@kernel.org,Linux Foundation,74
`;

function csvDataUrl(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function activity(
  title: string,
  patch: Partial<SubagentActivity>,
): SubagentActivity {
  return {
    title,
    status: 'running',
    stepCount: 0,
    startedAt: new Date().toISOString(),
    ...patch,
  };
}

function quickReplies(
  ctx: DemoContext,
  replies: string[],
  offerRecurringAutomation = false,
): void {
  ctx.showInline({
    name: 'ap_show_quick_replies',
    input: { replies, offerRecurringAutomation },
  });
}

function seedLongConversation(): PersistedAgentMessage[] {
  const topics = [
    'our Q3 support volume',
    'the invoice flow',
    'Slack alerts for churn risk',
    'lead scoring',
    'the onboarding emails',
    'duplicate HubSpot contacts',
    'the weekly KPI report',
    'Stripe refunds',
    'the Jira triage bot',
    'Airtable cleanup',
    'the holiday auto-reply',
    'Google Drive backups',
    'the NPS survey',
    'GitHub release notes',
    'the trial-to-paid alert',
    'the partner portal sync',
    'translation of product pages',
  ];
  const messages: PersistedAgentMessage[] = [];
  topics.forEach((topic, i) => {
    messages.push({
      role: PersistedAgentRole.USER,
      parts: [
        {
          type: PersistedAgentPartType.TEXT,
          text:
            i % 5 === 3
              ? `Okay, next one. Can you look at ${topic}? I think something changed last week but I'm not sure what, and the team keeps asking me about it in standup.`
              : `Turn ${i * 2 + 1}: what about ${topic}?`,
        },
      ],
    });
    const parts: PersistedAgentPart[] = [];
    if (i % 3 === 0) {
      parts.push({
        type: PersistedAgentPartType.THINKING_STATUS,
        text: `Looking into ${topic}`,
      });
      parts.push({
        type: PersistedAgentPartType.TOOL_CALL,
        toolCallId: `seed-${i}-a`,
        toolName: 'ap_list_across_projects',
        input: { query: topic },
        status: PersistedToolCallStatus.COMPLETED,
        output: { success: true },
      });
      parts.push({
        type: PersistedAgentPartType.TOOL_CALL,
        toolCallId: `seed-${i}-b`,
        toolName: 'ap_explore_data',
        input: { query: topic },
        status:
          i % 6 === 0
            ? PersistedToolCallStatus.ERROR
            : PersistedToolCallStatus.COMPLETED,
        output: { success: true },
        errorText: i % 6 === 0 ? 'Timed out after 30s' : undefined,
      });
    }
    const body =
      i % 4 === 1
        ? `Here's what I found about **${topic}**:\n\n| Week | Runs | Failures |\n|---|---|---|\n| W1 | 120 | 2 |\n| W2 | 134 | 0 |\n| W3 | 98 | 5 |\n\nThe dip in W3 lines up with the connection change.`
        : i % 4 === 2
        ? `For **${topic}**, this small code step does the job:\n\n\`\`\`js\nexport const code = async (inputs) => inputs.items.filter((x) => x.active);\n\`\`\`\n\nWant me to add it to the flow?`
        : `Short answer on ${topic}: it's running fine. ${'It ran on schedule every day this month and nobody changed its settings. '.repeat(
            1 + (i % 3),
          )}`;
    parts.push({ type: PersistedAgentPartType.TEXT, text: body });
    messages.push({ role: PersistedAgentRole.ASSISTANT, parts });
  });
  return messages;
}

const SCENARIOS: DemoScenario[] = [
  {
    id: 'short',
    group: 'Replies',
    label: 'Short reply',
    prompt: 'What can you help me with?',
    title: 'What I can help with',
    play: async (ctx) => {
      await ctx.wait(700);
      await ctx.text(SHORT_REPLY, { wordsPerTick: 1, tickMs: 60 });
    },
  },
  {
    id: 'markdown',
    group: 'Replies',
    label: 'Long markdown',
    prompt: 'Explain how webhooks work, with an example',
    title: 'How webhooks work',
    play: async (ctx) => {
      await ctx.wait(600);
      await ctx.text(MARKDOWN_REPLY, { wordsPerTick: 4, tickMs: 40 });
      ctx.source('https://www.activepieces.com/docs', 'Activepieces docs');
      ctx.source('https://stripe.com/docs/webhooks', 'Stripe webhooks');
    },
  },
  {
    id: 'document',
    group: 'Replies',
    label: 'Document preview',
    prompt: 'Write a one-page runbook for failed payments',
    title: 'Failed payments runbook',
    play: async (ctx) => {
      await ctx.wait(600);
      await ctx.text(DOCUMENT_REPLY, { wordsPerTick: 4, tickMs: 40 });
    },
  },
  {
    id: 'reasoning',
    group: 'Replies',
    label: 'Thinking (reasoning)',
    prompt: 'Should I use a webhook or polling for new Shopify orders?',
    title: 'Webhook or polling for Shopify',
    play: async (ctx) => {
      await ctx.wait(400);
      await ctx.reasoning(
        'The user wants new Shopify orders. Shopify supports order webhooks, which fire instantly and avoid rate limits. Polling would need the Admin API every few minutes and could miss bursts. Webhooks need a public URL, but flows already have one. Edge case: webhooks can be delivered twice, so the flow should dedupe on order id. Recommend webhooks, mention dedupe.',
        { wordsPerTick: 2, tickMs: 70 },
      );
      await ctx.text(
        "Use the **webhook** trigger. Shopify sends each order the moment it's placed, so you get it instantly and don't burn API calls.\n\nOne catch: Shopify can deliver the same order twice. I'll add a small check on the order ID so you never process one twice.",
      );
    },
  },
  {
    id: 'quick-replies',
    group: 'Replies',
    label: 'Quick replies',
    prompt: 'Help me pick my first automation',
    title: 'Picking a first automation',
    play: async (ctx) => {
      await ctx.wait(500);
      await ctx.text(
        'Happy to! Most teams start with something small that runs every day. Which of these sounds closest?',
      );
      quickReplies(
        ctx,
        [
          'Post new leads to Slack',
          'Save email attachments to Drive',
          'Send a weekly report',
          'Something else',
        ],
        true,
      );
    },
  },
  {
    id: 'memory',
    group: 'Replies',
    label: 'Memory saved',
    prompt: 'Remember that our fiscal year starts in February',
    title: 'Fiscal year note',
    play: async (ctx) => {
      await ctx.wait(400);
      await ctx.tool({
        name: 'ap_remember',
        input: { memory: 'Fiscal year starts in February' },
        output: { saved: true },
        ms: 700,
      });
      await ctx.text(
        "Got it. I'll use a February–January fiscal year for reports from now on.",
      );
    },
  },

  {
    id: 'tools',
    group: 'Tools',
    label: 'Tool calls in sequence',
    prompt: 'Check which apps are connected and how my flows ran this week',
    title: 'Connections and runs this week',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status('Checking your connections');
      await ctx.tool({
        name: 'ap_list_connections',
        input: {},
        ms: 1200,
      });
      await ctx.tool({
        name: 'ap_research_pieces',
        input: { query: 'slack gmail' },
        ms: 900,
      });
      await ctx.status('Looking at this week’s runs');
      await ctx.tool({
        name: 'ap_list_across_projects',
        input: { query: 'flow runs this week' },
        ms: 1500,
      });
      await ctx.tool({
        name: 'ap_explore_data',
        input: { query: 'failed runs by flow' },
        ms: 1100,
      });
      await ctx.text(
        'You have **4 apps** connected: Slack, Gmail, HubSpot and Google Sheets.\n\n| Flow | Runs | Failed |\n|---|---|---|\n| Lead alerts | 212 | 0 |\n| Invoice sync | 48 | 3 |\n| Weekly digest | 1 | 0 |\n\nThe 3 invoice failures were all on Tuesday, when the QuickBooks token expired.',
      );
    },
  },
  {
    id: 'tool-error',
    group: 'Tools',
    label: 'Tool fails with an error',
    prompt: 'Post the weekly report to #marketing',
    title: 'Weekly report to #marketing',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status('Posting to Slack');
      await ctx.tool({ name: 'ap_list_connections', input: {}, ms: 700 });
      await ctx.tool({
        name: 'ap_execute_action',
        input: {
          pieceName: '@activepieces/piece-slack',
          actionName: 'send_channel_message',
          input: { channel: '#marketing', text: 'Weekly report' },
        },
        ms: 1600,
        error:
          "channel_not_found: #marketing doesn't exist or the bot isn't a member.",
      });
      await ctx.status('Trying another way');
      await ctx.tool({
        name: 'ap_resolve_property_options',
        input: {
          pieceName: '@activepieces/piece-slack',
          propertyName: 'channel',
        },
        ms: 900,
      });
      await ctx.text(
        "I couldn't post it: Slack says **#marketing** doesn't exist or the bot isn't in it. I did find **#marketing-team** — want me to post there instead?",
      );
      quickReplies(ctx, ['Yes, post to #marketing-team', 'No, cancel']);
    },
  },
  {
    id: 'receipts',
    group: 'Tools',
    label: 'Action results (cards)',
    prompt:
      'Create a Trello card for the launch and add the 3 new leads to HubSpot',
    title: 'Trello card and HubSpot leads',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status('Creating the Trello card');
      const trello = await ctx.tool({
        name: 'ap_execute_action',
        input: {
          pieceName: '@activepieces/piece-trello',
          actionName: 'create_card',
          input: { list: 'Launch', name: 'Q4 launch checklist' },
        },
        ms: 1800,
      });
      ctx.receipt(trello, {
        actionDisplayName: 'Create Card',
        pieceName: '@activepieces/piece-trello',
        connectionLabel: 'Product board',
        status: 'success',
        output: {
          id: 'c-81',
          url: 'https://trello.com/c/demo',
          name: 'Q4 launch checklist',
        },
      });
      await ctx.text('The card is ready. Now the leads.\n\n');
      await ctx.status('Adding the leads');
      const leads = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'];
      for (const [i, name] of leads.entries()) {
        const id = await ctx.tool({
          name: 'ap_execute_action',
          input: {
            pieceName: '@activepieces/piece-hubspot',
            actionName: 'create_contact',
            input: { name },
          },
          ms: 900,
        });
        ctx.receipt(id, {
          actionDisplayName: `Create Contact: ${name}`,
          pieceName: '@activepieces/piece-hubspot',
          connectionLabel: 'sales@acme.com',
          status: i === 2 ? 'failed' : 'success',
          output: i === 2 ? null : { id: `hs-${i}`, name },
          errorMessage:
            i === 2 ? 'A contact with this email already exists.' : undefined,
        });
      }
      await ctx.text(
        'Created the Trello card and added **2 of 3** leads. Alan Turing was already in HubSpot, so I skipped him.',
      );
    },
  },
  {
    id: 'approval',
    group: 'Tools',
    label: 'Approval (approve or deny)',
    prompt: 'Email the Q3 summary to the leadership team',
    title: 'Q3 summary email',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status('Drafting the email');
      await ctx.tool({ name: 'ap_list_connections', input: {}, ms: 700 });
      const input = {
        to: ['ceo@acme.com', 'cfo@acme.com', 'coo@acme.com'],
        subject: 'Q3 summary',
        body: 'Hi all,\n\nQ3 revenue grew 18% and churn fell to 2.1%. Full numbers attached.\n\nThanks!',
      };
      const decision = await ctx.approval({
        name: 'ap_execute_action',
        input: {
          pieceName: '@activepieces/piece-gmail',
          actionName: 'send_email',
          input,
        },
        preview: {
          pieceName: '@activepieces/piece-gmail',
          actionName: 'send_email',
          actionDisplayName: 'Send Email',
          connectionLabel: 'mo@acme.com',
          input,
          isBatch: false,
        },
      });
      if (!decision.approved) {
        ctx.deny(decision.toolCallId);
        await ctx.text(
          "Okay, I didn't send anything. Want me to change the draft?",
        );
        quickReplies(ctx, ['Make it shorter', 'Add the churn chart']);
        return;
      }
      await ctx.wait(1400);
      ctx.receipt(decision.toolCallId, {
        actionDisplayName: 'Send Email',
        pieceName: '@activepieces/piece-gmail',
        connectionLabel: 'mo@acme.com',
        status: 'success',
        output: { id: '18c2f0', threadId: '18c2f0', labelIds: ['SENT'] },
      });
      ctx.complete(decision.toolCallId);
      await ctx.text('Sent! The leadership team has the Q3 summary.');
    },
  },
  {
    id: 'batch',
    group: 'Tools',
    label: 'Batch approval with progress',
    prompt: 'Send a renewal reminder to the 24 customers expiring this month',
    title: 'Renewal reminders',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status('Finding customers who renew this month');
      await ctx.tool({
        name: 'ap_explore_data',
        input: { query: 'renewals' },
        ms: 1000,
      });
      const samples = [
        { to: 'ana@globex.com', subject: 'Your plan renews on Nov 12' },
        { to: 'li@initech.com', subject: 'Your plan renews on Nov 15' },
        { to: 'sam@umbrella.io', subject: 'Your plan renews on Nov 21' },
      ];
      const decision = await ctx.approval({
        name: 'ap_execute_action',
        input: {
          pieceName: '@activepieces/piece-gmail',
          actionName: 'send_email',
          batchCount: 24,
          items: samples,
        },
        preview: {
          pieceName: '@activepieces/piece-gmail',
          actionName: 'send_email',
          actionDisplayName: 'Send Email',
          connectionLabel: 'billing@acme.com',
          input: {},
          isBatch: true,
          batchCount: 24,
          batchSamples: samples,
        },
      });
      if (!decision.approved) {
        ctx.deny(decision.toolCallId);
        await ctx.text('No problem — nothing was sent.');
        return;
      }
      const total = 24;
      let progress: BatchProgressData = {
        label: 'Sending renewal reminders',
        total,
        completed: 0,
        succeeded: 0,
        failed: 0,
        done: false,
        results: [],
      };
      for (let i = 0; i < total; i += 3) {
        await ctx.wait(350);
        const completed = Math.min(total, i + 3);
        const failed = completed >= 18 ? 2 : completed >= 9 ? 1 : 0;
        progress = {
          ...progress,
          completed,
          failed,
          succeeded: completed - failed,
          done: completed === total,
        };
        ctx.toolProgress(decision.toolCallId, progress);
      }
      ctx.complete(decision.toolCallId, { batchProgress: progress });
      await ctx.text(
        'Sent **22 of 24** reminders. Two addresses bounced (they look like typos) — want the list?',
      );
    },
  },

  {
    id: 'connection-picker',
    group: 'Cards',
    label: 'Connection picker',
    prompt: 'Add a row to my Google Sheet for every new Stripe payment',
    title: 'Stripe payments to Google Sheets',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status('Checking your Google accounts');
      await ctx.tool({ name: 'ap_list_connections', input: {}, ms: 800 });
      await ctx.text(
        'You have a few Google Sheets accounts. Which one should I use?',
      );
      const decision = await ctx.display({
        name: 'ap_show_connection_picker',
        input: {
          piece: 'google-sheets',
          displayName: 'Google Sheets',
          connections: [
            {
              label: 'mo@acme.com',
              project: 'Marketing',
              externalId: 'gs-1',
              projectId: 'p1',
              status: 'ACTIVE',
            },
            {
              label: 'ops@acme.com',
              project: 'Operations',
              externalId: 'gs-2',
              projectId: 'p2',
              status: 'ACTIVE',
            },
            {
              label: 'old-intern@acme.com',
              project: 'Marketing',
              externalId: 'gs-3',
              projectId: 'p1',
              status: 'ERROR',
            },
          ],
        },
        output: (payload) => ({ label: payload.label }),
      });
      await ctx.wait(300);
      await ctx.text(
        decision.approved
          ? `Using **${String(
              decision.payload?.label ?? 'that account',
            )}**. I'll add a row for every new payment.`
          : 'Okay, I left it for now. Tell me when you want to pick an account.',
      );
    },
  },
  {
    id: 'connection-required',
    group: 'Cards',
    label: 'Connection required',
    prompt: 'Send me a Telegram message when someone fills the contact form',
    title: 'Contact form to Telegram',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.tool({ name: 'ap_list_connections', input: {}, ms: 800 });
      await ctx.text(
        "You haven't connected Telegram yet. Connect it and I'll finish the setup.",
      );
      const decision = await ctx.display({
        name: 'ap_show_connection_required',
        input: { piece: 'telegram-bot', displayName: 'Telegram' },
        output: (payload) => ({ label: payload.label ?? 'Telegram bot' }),
      });
      await ctx.text(
        decision.approved
          ? 'Connected. You will get a Telegram message for every new form.'
          : 'No worries — connect Telegram whenever you are ready.',
      );
    },
  },
  {
    id: 'questions',
    group: 'Cards',
    label: 'Questions form',
    prompt: 'Set up a weekly report for my team',
    title: 'Weekly team report',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.text('A few quick questions so the report fits your team:');
      const decision = await ctx.display({
        name: 'ap_show_questions',
        input: {
          questions: [
            {
              type: 'choice',
              title: 'Destination',
              question: 'Where should the report go?',
              options: [
                { label: 'Slack', piece: 'slack' },
                { label: 'Microsoft Teams', piece: 'microsoft-teams' },
                { label: 'Email', piece: 'gmail' },
              ],
              allowCustom: true,
            },
            {
              type: 'multi_choice',
              title: 'Contents',
              question: 'What should it include?',
              options: [
                'New leads',
                'Closed deals',
                'Support tickets',
                'Failed runs',
              ],
            },
            {
              type: 'slider',
              title: 'Length',
              question: 'How many items per section?',
              min: 3,
              max: 20,
              step: 1,
              unit: 'items',
              defaultValue: 5,
            },
            { type: 'time', title: 'Time', question: 'What time on Monday?' },
            { type: 'date', title: 'Start', question: 'When should it start?' },
          ],
        },
        output: (payload) => ({ answers: payload.answers }),
      });
      await ctx.wait(400);
      await ctx.text(
        decision.approved
          ? "Perfect, I have everything. I'll set it up with those answers."
          : 'Skipped. I will use sensible defaults: Slack, every Monday at 9:00.',
      );
    },
  },
  {
    id: 'project-picker',
    group: 'Cards',
    label: 'Project picker',
    prompt: 'Create a lead-scoring flow',
    title: 'Lead-scoring flow',
    play: async (ctx) => {
      const currentProjectId = authenticationSession.getProjectId();
      await ctx.wait(300);
      const decision = await ctx.display({
        name: 'ap_show_project_picker',
        input: {
          question: 'Which project should this flow live in?',
          suggestedProjects: [
            ...(currentProjectId
              ? [{ name: 'This project', id: currentProjectId }]
              : []),
            { name: 'Marketing', id: 'demo-p1' },
            { name: 'Sales operations', id: 'demo-p2' },
            {
              name: 'A project with a really long name that keeps going',
              id: 'demo-p3',
            },
          ],
        },
        output: (payload) => ({ projectId: payload.projectId }),
      });
      await ctx.text(
        decision.approved
          ? `Great — I'll create it in **${String(
              decision.payload?.projectName ?? 'that project',
            )}**.`
          : 'Okay, tell me the project when you are ready.',
      );
    },
  },
  {
    id: 'mcp-reconnect',
    group: 'Cards',
    label: 'Reconnect integration',
    prompt: 'Pull my latest Linear issues',
    title: 'Latest Linear issues',
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.tool({
        name: 'mcp__linear__list_issues',
        input: {},
        ms: 900,
        error: '401 Unauthorized: the token expired',
      });
      await ctx.text(
        'Your Linear connection expired. Reconnect it and I will try again.',
      );
      const decision = await ctx.display({
        name: 'ap_show_mcp_reconnect',
        input: {
          connectorUuid: 'demo-linear',
          displayName: 'Linear',
          connectUrl: 'https://linear.app',
          reason: 'expired',
        },
      });
      if (decision.approved) {
        await ctx.tool({
          name: 'mcp__linear__list_issues',
          input: {},
          ms: 900,
        });
        await ctx.text(
          'Back in. You have **7 open issues**, 2 of them urgent.',
        );
      } else {
        await ctx.text('Okay, skipped Linear for now.');
      }
    },
  },
  {
    id: 'showcase',
    group: 'Cards',
    label: 'Showcase tiles',
    prompt: 'What can you do with Slack?',
    title: 'Ideas for Slack',
    play: async (ctx) => {
      await ctx.wait(400);
      await ctx.text('Here are a few things teams automate with Slack:');
      ctx.showInline({
        name: 'ap_show_showcase',
        input: {
          headline: 'Slack, on autopilot',
          subhead: 'Pick one and I will build it',
          layout: 'grid',
          tiles: [
            {
              title: 'Lead alerts',
              description: 'Post new HubSpot leads to #sales',
              app: 'hubspot',
            },
            {
              title: 'Standup bot',
              description: 'Collect updates every morning',
              app: 'slack',
            },
            {
              title: 'Incident pager',
              description: 'Ping on-call when a run fails',
              icon: 'bell',
            },
            {
              title: 'Weekly digest',
              description: 'A Monday summary of key numbers',
              icon: 'chart',
            },
          ],
        },
      });
      quickReplies(ctx, ['Build the lead alerts', 'Show me more ideas']);
    },
  },

  {
    id: 'build',
    group: 'Builds & tasks',
    label: 'Flow build',
    prompt: 'Build me a flow that posts new HubSpot deals to Slack',
    title: 'HubSpot deals to Slack',
    realtime: true,
    play: (ctx) => demoLiveBuilds.play({ ctx, fails: false }),
  },
  {
    id: 'build-failed',
    group: 'Builds & tasks',
    label: 'Flow build fails its test',
    prompt: 'Build a flow that posts new HubSpot deals to #sales',
    title: 'HubSpot deals to #sales',
    realtime: true,
    play: (ctx) => demoLiveBuilds.play({ ctx, fails: true }),
  },
  {
    id: 'tasks',
    group: 'Builds & tasks',
    label: 'Parallel research tasks',
    prompt: "Research our top 3 competitors' pricing",
    title: 'Competitor pricing research',
    play: async (ctx) => {
      await ctx.wait(300);
      const subjects = ['Zapier', 'Make', 'n8n'];
      const call = ctx.startTool({
        name: 'ap_deep_research',
        input: { subjects },
      });
      const ids = subjects.map((_, index) =>
        subagentProgressId.forSubject({ toolCallId: call.toolCallId, index }),
      );
      const done: SubagentActivity[] = [];
      for (let step = 1; step <= 4; step += 1) {
        await ctx.wait(1100);
        subjects.forEach((subject, i) => {
          const finished = step === 4 || (i === 0 && step === 3);
          const timeline: SubagentActivity['timeline'] = [
            {
              kind: 'search',
              query: `${subject} pricing 2026`,
              results: [
                {
                  url: `https://${subject.toLowerCase()}.com/pricing`,
                  title: `${subject} pricing`,
                },
              ],
            },
            ...(step >= 2
              ? [
                  {
                    kind: 'read' as const,
                    url: `https://${subject.toLowerCase()}.com/pricing`,
                    title: `${subject} pricing`,
                  },
                ]
              : []),
            ...(step >= 3
              ? [{ kind: 'status' as const, text: 'Comparing plans' }]
              : []),
          ];
          const data = activity(`Research ${subject} pricing`, {
            status: finished ? 'done' : 'running',
            stepCount: step,
            statusLine: finished
              ? 'Done'
              : step === 1
              ? 'Searching'
              : 'Reading pricing page',
            timeline,
            summary: finished
              ? `${subject}: free tier, paid from $19/mo`
              : undefined,
            durationMs: finished ? step * 1100 : undefined,
          });
          ctx.subagent(ids[i], data);
          if (step === 4) done[i] = data;
        });
      }
      call.succeed({ tasks: done.map((data) => ({ activity: data })) });
      await ctx.text(
        '| | Free tier | Paid from | Per task pricing |\n|---|---|---|---|\n| Zapier | Yes | $19.99/mo | Yes |\n| Make | Yes | $9/mo | Per operation |\n| n8n | Self-host | $20/mo | Per execution |\n\nWe are cheapest for teams running many small flows.',
      );
    },
  },
  {
    id: 'files',
    group: 'Builds & tasks',
    label: 'Attachments, files and image',
    prompt: 'Clean up the attached lead list and chart the pipeline',
    title: 'Lead list cleanup',
    attachments: [
      {
        name: 'leads-export-november.csv',
        type: 'text/csv',
        content: CLEAN_CSV,
      },
      {
        name: 'a-very-long-file-name-for-the-pipeline-screenshot-final-v3.png',
        type: 'image/png',
        content: 'png',
      },
      { name: 'notes.md', type: 'text/markdown', content: '# Notes' },
    ],
    play: async (ctx) => {
      await ctx.wait(300);
      await ctx.status(`Reading ${ctx.fileNames.length || 3} files`);
      const code = await ctx.tool({
        name: 'ap_run_code',
        input: { title: 'Clean and dedupe the leads' },
        ms: 1800,
      });
      ctx.file(code, {
        url: csvDataUrl(CLEAN_CSV),
        mediaType: 'text/csv',
        fileName: 'leads-cleaned.csv',
        byteSize: CLEAN_CSV.length,
        title: 'Cleaned leads',
      });
      await ctx.status('Drawing the chart');
      const image = await ctx.tool({
        name: 'ap_generate_image',
        input: { prompt: 'Bar chart of the pipeline by month' },
        ms: 2200,
      });
      ctx.image(image, {
        url: svgDataUrl('Pipeline by month'),
        mediaType: 'image/svg+xml',
        prompt: 'Bar chart of the pipeline by month',
        caption: 'Pipeline by month',
      });
      await ctx.text(
        'Removed **14 duplicates** and 3 rows without an email. The cleaned list and the chart are above.',
      );
    },
  },

  {
    id: 'model-error',
    group: 'Errors',
    label: 'Model error, then Retry works',
    prompt: "Summarize yesterday's failed runs",
    title: "Yesterday's failed runs",
    play: async (ctx) => {
      await ctx.wait(400);
      await ctx.tool({
        name: 'ap_explore_data',
        input: { query: 'failed runs' },
        ms: 900,
      });
      if (ctx.attempt === 0) {
        await ctx.text("Looking at yesterday's runs, ");
        await ctx.wait(500);
        ctx.fail('The AI provider is overloaded (529). Please try again.');
      }
      await ctx.text(
        'Yesterday **3 runs failed**, all in *Invoice sync*: the QuickBooks token expired at 14:02. Reconnecting QuickBooks fixes it.',
      );
    },
  },
  {
    id: 'credits',
    group: 'Errors',
    label: 'Out of AI credits',
    prompt: 'Write 50 product descriptions',
    title: 'Product descriptions',
    play: async (ctx) => {
      await ctx.wait(700);
      ctx.quotaExceeded();
    },
  },
  {
    id: 'no-reply',
    group: 'Errors',
    label: 'No reply',
    prompt: 'Do the thing from last week',
    title: 'The thing from last week',
    play: async (ctx) => {
      await ctx.wait(1500);
    },
  },
  {
    id: 'send-fails',
    group: 'Errors',
    label: 'Send fails, then Retry works',
    prompt: 'Rename my Lead alerts flow to Sales alerts',
    title: 'Rename Lead alerts',
    rejectSendOnFirstTry: true,
    play: async (ctx) => {
      await ctx.wait(400);
      await ctx.tool({
        name: 'ap_update_flow',
        input: { displayName: 'Sales alerts' },
        ms: 800,
      });
      await ctx.text('Done — it is now called **Sales alerts**.');
    },
  },

  {
    id: 'slow',
    group: 'Stress',
    label: 'Slow reply (switch chats meanwhile)',
    prompt: 'Give me a detailed plan for migrating from Zapier',
    title: 'Migrating from Zapier',
    play: async (ctx) => {
      await ctx.wait(800);
      await ctx.status('Looking at your zaps');
      await ctx.tool({
        name: 'ap_list_across_projects',
        input: { query: 'zaps' },
        ms: 3000,
      });
      await ctx.tool({
        name: 'ap_research_pieces',
        input: { query: 'zapier alternatives' },
        ms: 3000,
      });
      await ctx.status('Writing the plan');
      await ctx.wait(1500);
      await ctx.text(SLOW_REPLY, { wordsPerTick: 1, tickMs: 180 });
    },
  },
  {
    id: 'long',
    group: 'Stress',
    label: 'Long conversation (34 turns)',
    prompt: 'Long conversation',
    title: 'Ops review — a long conversation',
    seed: seedLongConversation,
    play: async (ctx) => {
      await ctx.wait(500);
      await ctx.text(
        'Still here, at the bottom of a long chat. Scroll up to check the history.',
      );
    },
  },
];

SCENARIOS.push(...demoLiveScenarios, ...demoChangeScenarios);
SCENARIOS.push(...demoCapabilities.scenarios);

const FALLBACK: DemoScenario = {
  id: 'fallback',
  group: 'Replies',
  label: 'Any message',
  prompt: '',
  title: '',
  play: async (ctx) => {
    await ctx.wait(500);
    const said =
      ctx.userText.length > 80 ? `${ctx.userText.slice(0, 80)}…` : ctx.userText;
    await ctx.text(
      `Demo mode is on, so this is a scripted reply to “${said}”.\n\nPick a scenario from the panel menu, or send one of these:`,
    );
    const picks = [...SCENARIOS]
      .filter((s) => !s.seed)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((s) => s.prompt);
    quickReplies(ctx, picks);
  },
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function match(content: string): DemoScenario | undefined {
  const wanted = normalize(content);
  return SCENARIOS.find((s) => normalize(s.prompt) === wanted);
}

function attachmentsFor(content: string): File[] | undefined {
  if (!chatDemo.isActive()) return undefined;
  const scenario = match(content);
  if (!scenario?.attachments) return undefined;
  return scenario.attachments.map(
    (file) => new File([file.content], file.name, { type: file.type }),
  );
}

export const demoScenarios = {
  all: SCENARIOS,
  groups: [...new Set(SCENARIOS.map((s) => s.group))],
  byId: (id: string) => SCENARIOS.find((s) => s.id === id),
  match,
  fallback: FALLBACK,
  attachmentsFor,
};

export type DemoScenario = {
  id: string;
  group: string;
  label: string;
  prompt: string;
  title: string;
  attachments?: Array<{ name: string; type: string; content: string }>;
  seed?: () => PersistedAgentMessage[];
  rejectSendOnFirstTry?: boolean;
  realtime?: boolean;
  play: (ctx: DemoContext) => Promise<void>;
};
