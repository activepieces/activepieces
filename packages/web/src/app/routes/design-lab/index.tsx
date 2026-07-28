import {
  ActionPreviewEvent,
  ActionReceiptEvent,
  ConsentPreview,
} from '@activepieces/shared';
import { ReactNode, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ActionReceiptCard } from '../chat-with-ai/components/action-receipt-card';
import { ConsentCard } from '../chat-with-ai/components/consent-card';

export function DesignLabPage() {
  const [params] = useSearchParams();
  const rtl = params.get('rtl') === '1';
  const width = params.get('w') ?? '680';

  useEffect(() => {
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    return () => {
      document.documentElement.setAttribute('dir', 'ltr');
    };
  }, [rtl]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div
        className="mx-auto flex flex-col gap-8"
        style={{ maxWidth: `${width}px` }}
      >
        {SCENARIOS.map((scenario) => (
          <section
            key={scenario.id}
            data-lab-id={scenario.id}
            className="flex flex-col gap-2"
          >
            <h2 className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
              {scenario.id}
            </h2>
            {scenario.render()}
          </section>
        ))}
      </div>
    </div>
  );
}

function preview(
  consent: ConsentPreview,
  overrides?: Partial<ActionPreviewEvent>,
): ActionPreviewEvent {
  return {
    toolCallId: `lab-${consent.category}-${consent.severity}`,
    pieceName: '@activepieces/piece-stripe',
    actionName: 'create_refund',
    actionDisplayName: 'Create Refund',
    input: {},
    isBatch: false,
    consent,
    ...overrides,
  };
}

function card(
  consent: ConsentPreview,
  overrides?: Partial<ActionPreviewEvent>,
) {
  const event = preview(consent, overrides);
  return (
    <ConsentCard
      preview={event}
      consent={consent}
      onRun={() => undefined}
      onCancel={() => undefined}
      onDismiss={() => undefined}
    />
  );
}

function receipt(partial: Partial<ActionReceiptEvent>): ActionReceiptEvent {
  return {
    toolCallId: 'lab-receipt',
    actionDisplayName: 'Send Email',
    pieceName: '@activepieces/piece-gmail',
    status: 'success',
    output: null,
    timestamp: new Date('2026-07-27T18:09:00Z').toISOString(),
    ...partial,
  };
}

const STRIPE_REFUND: ConsentPreview = {
  category: 'live_test',
  severity: 'financial',
  flowName: 'Refund Failed Orders',
  effects: [
    {
      displayName: 'Create Refund',
      detail: 'stripe · create_refund',
      kind: 'financial',
      recipientResolved: false,
    },
    {
      displayName: 'Run Code',
      detail: 'code · run',
      kind: 'input_dependent',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const EMAIL_TEST: ConsentPreview = {
  category: 'live_test',
  severity: 'external',
  flowName: 'Weekly Digest',
  effects: [
    {
      displayName: 'Send Email',
      detail: 'gmail · send_email',
      kind: 'outward_send',
      recipient: 'omar@activepieces.com',
      recipientResolved: true,
    },
    {
      displayName: 'Add Row',
      detail: 'google-sheets · insert_row',
      kind: 'external_write',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: true,
};

const TEMPLATED_RECIPIENT: ConsentPreview = {
  category: 'step_test',
  severity: 'external',
  flowName: 'Notify The Requester',
  effects: [
    {
      displayName: 'Send Slack Message',
      detail: 'slack · send_channel_message',
      kind: 'outward_send',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const DELETE_RECORDS: ConsentPreview = {
  category: 'delete_records',
  severity: 'destructive',
  recordCount: 2,
  effects: [
    {
      displayName: 'Delete Records',
      detail: 'tables · delete_records',
      kind: 'internal_destructive',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const DELETE_TABLE: ConsentPreview = {
  category: 'delete_table',
  severity: 'destructive',
  targetName: 'Leads',
  effects: [
    {
      displayName: 'Delete Table',
      detail: 'tables · delete_table',
      kind: 'internal_destructive',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const PUBLISH: ConsentPreview = {
  category: 'publish',
  severity: 'external',
  flowName: 'Onboarding Emails',
  effects: [
    {
      displayName: 'Send Email',
      detail: 'gmail · send_email',
      kind: 'outward_send',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const RUN_CODE: ConsentPreview = {
  category: 'run_code',
  severity: 'unknown',
  effects: [
    {
      displayName: 'Run Code',
      detail: 'code · run',
      kind: 'input_dependent',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const CONNECTOR: ConsentPreview = {
  category: 'connector_action',
  severity: 'external',
  targetName: 'Linear · Create Issue',
  effects: [
    {
      displayName: 'Create Issue',
      detail: 'linear · create_issue',
      kind: 'external_write',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: true,
};

const UNKNOWN_TOOL: ConsentPreview = {
  category: 'unknown_tool',
  severity: 'unknown',
  effects: [
    {
      displayName: 'Unrecognised Tool',
      detail: 'mcp__acme__do_thing',
      kind: 'unknown',
      recipientResolved: false,
    },
  ],
  resolved: false,
  reusable: false,
};

const LONG_TEXT: ConsentPreview = {
  category: 'live_test',
  severity: 'external',
  flowName:
    'Sync Enterprise Customer Success Escalations Into The Quarterly Revenue Retrospective Board',
  effects: [
    {
      displayName:
        'Send An Extremely Long Transactional Notification Email To The Account Owner',
      detail: 'microsoft-outlook-with-a-long-package-name · send_email_v2_beta',
      kind: 'outward_send',
      recipient:
        'very.long.email.address.for.testing@enterprise-customer-domain.example.com',
      recipientResolved: true,
    },
  ],
  resolved: true,
  reusable: true,
};

const MANY_EFFECTS: ConsentPreview = {
  category: 'live_test',
  severity: 'financial',
  flowName: 'Month End Close',
  effects: [
    {
      displayName: 'Create Refund',
      detail: 'stripe · create_refund',
      kind: 'financial',
      recipientResolved: false,
    },
    {
      displayName: 'Send Email',
      detail: 'gmail · send_email',
      kind: 'outward_send',
      recipient: 'finance@acme.com',
      recipientResolved: true,
    },
    {
      displayName: 'Send Slack Message',
      detail: 'slack · send_message',
      kind: 'outward_send',
      recipientResolved: false,
    },
    {
      displayName: 'Add Row',
      detail: 'google-sheets · insert_row',
      kind: 'external_write',
      recipientResolved: false,
    },
    {
      displayName: 'Delete Records',
      detail: 'tables · delete_records',
      kind: 'internal_destructive',
      recipientResolved: false,
    },
    {
      displayName: 'Run Code',
      detail: 'code · run',
      kind: 'input_dependent',
      recipientResolved: false,
    },
  ],
  resolved: true,
  reusable: false,
};

const SCENARIOS: { id: string; render: () => ReactNode }[] = [
  { id: '01-financial-refund', render: () => card(STRIPE_REFUND) },
  { id: '02-email-resolved-recipient', render: () => card(EMAIL_TEST) },
  { id: '03-templated-recipient', render: () => card(TEMPLATED_RECIPIENT) },
  { id: '04-delete-records', render: () => card(DELETE_RECORDS) },
  { id: '05-delete-table', render: () => card(DELETE_TABLE) },
  { id: '06-publish-and-switch-on', render: () => card(PUBLISH) },
  { id: '07-run-code', render: () => card(RUN_CODE) },
  { id: '08-connector-action', render: () => card(CONNECTOR) },
  { id: '09-unknown-unresolved', render: () => card(UNKNOWN_TOOL) },
  { id: '10-long-text-overflow', render: () => card(LONG_TEXT) },
  { id: '11-many-effects', render: () => card(MANY_EFFECTS) },
  {
    id: '12-receipts',
    render: () => (
      <div className="flex flex-col gap-2">
        <ActionReceiptCard
          receipt={receipt({
            status: 'success',
            output: { id: 're_123', amount: 4200 },
          })}
        />
        <ActionReceiptCard receipt={receipt({ status: 'declined' })} />
        <ActionReceiptCard receipt={receipt({ status: 'timed_out' })} />
        <ActionReceiptCard
          receipt={receipt({
            status: 'failed',
            errorMessage:
              'No connection found for gmail. Connect an account and try again.',
          })}
        />
      </div>
    ),
  },
];
