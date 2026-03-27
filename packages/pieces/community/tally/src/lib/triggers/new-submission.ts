import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { tallyAuth } from '../..';
import { formsDropdown, tallyApiClient } from '../common';

type TallyOption = { id: string; text: string };

type TallyField = {
  key: string;
  label: string;
  type: string;
  value: unknown;
  options?: TallyOption[];
};

type TallyWebhookPayload = {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
};

function resolveFieldValue(field: TallyField): unknown {
  if (
    Array.isArray(field.value) &&
    field.options &&
    field.options.length > 0
  ) {
    const optionMap = Object.fromEntries(
      field.options.map((o) => [o.id, o.text])
    );
    const resolved = (field.value as string[]).map(
      (id) => optionMap[id] ?? id
    );
    return resolved.length === 1 ? resolved[0] : resolved;
  }
  return field.value;
}

export const tallyFormsNewSubmission = createTrigger({
  name: 'new-submission',
  displayName: 'New Submission',
  auth: tallyAuth,
  description: 'Triggers when a form receives a new submission',
  props: {
    formId: formsDropdown,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    eventId: 'abc123',
    eventType: 'FORM_RESPONSE',
    createdAt: '2024-01-01T00:00:00.000Z',
    data: {
      responseId: 'resp_001',
      submissionId: 'sub_001',
      respondentId: 'resp_001',
      formId: 'form_001',
      formName: 'Contact Form',
      createdAt: '2024-01-01T00:00:00.000Z',
      fields: {
        'Your Name': 'John Doe',
        'Your Email': 'john@example.com',
        'Which plan?': 'Professional',
      },
    },
  },
  async onEnable(context) {
    const webhookId = await tallyApiClient.createWebhook(
      context.auth.secret_text,
      context.propsValue.formId,
      context.webhookUrl
    );
    await context.store.put('_tally_webhook_id', webhookId);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('_tally_webhook_id');
    if (webhookId) {
      await tallyApiClient.deleteWebhook(context.auth.secret_text, webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as TallyWebhookPayload;
    const rawFields: TallyField[] = body?.data?.fields ?? [];

    const fields: Record<string, unknown> = {};
    const labelCount: Record<string, number> = {};
    for (const field of rawFields) {
      const base = field.label;
      const count = labelCount[base] ?? 0;
      const key = count === 0 ? base : `${base} (${count + 1})`;
      labelCount[base] = count + 1;
      fields[key] = resolveFieldValue(field);
    }
    return [
      {
        ...body,
        data: {
          ...body.data,
          fields,
        },
      },
    ];
  },
});
