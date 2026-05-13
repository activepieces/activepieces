import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { WebhookInformation, jotformCommon } from '../common';
import { jotformAuth } from '../..';

export const newSubmission = createTrigger({
  auth: jotformAuth,
  name: 'new_submission',
  displayName: 'New Submission',
  description:
    'Triggers when someone submits a response to your form. Each form field is returned as a separate field using the question label as the key.',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    form_id: '31751954731962',
    submission_id: '237955080346633702',
    ip: '123.123.123.123',
    type: 'WEB',
    pretty: 'Name: Bart Simpson\nYour Message: ¡Ay, caramba!',
    name: 'Bart Simpson',
    your_message: '¡Ay, caramba!',
  },
  props: {
    formId: jotformCommon.form,
  },
  async onEnable(context) {
    await jotformCommon.subscribeWebhook(
      context.propsValue['formId'],
      context.webhookUrl,
      context.auth
    );

    await context.store?.put<WebhookInformation>(
      '_new_jotform_submission_trigger',
      { jotformWebhook: context.webhookUrl }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_jotform_submission_trigger'
    );

    if (response !== null && response !== undefined) {
      await jotformCommon.unsubscribeWebhook(
        context.propsValue['formId'],
        response.jotformWebhook,
        context.auth
      );
    }
  },
  async run(context) {
    const body = context.payload.body as Record<string, unknown>;

    const answers = parseAnswers(body['rawRequest']);

    return [
      {
        ...answers,
        form_id: body['formID'] ?? null,
        submission_id: body['submissionID'] ?? null,
        ip: body['ip'] ?? null,
        type: body['type'] ?? null,
        pretty: body['pretty'] ?? null,
      },
    ];
  },
});

type JotFormField = {
  text: string;
  type: string;
  answer: unknown;
  prettyFormat?: string;
};

function parseAnswers(rawRequest: unknown): Record<string, unknown> {
  let parsed: Record<string, JotFormField> | null = null;

  if (typeof rawRequest === 'string') {
    try {
      parsed = JSON.parse(rawRequest) as Record<string, JotFormField>;
    } catch {
      return {};
    }
  } else if (rawRequest !== null && typeof rawRequest === 'object') {
    parsed = rawRequest as Record<string, JotFormField>;
  }

  if (!parsed) return {};

  const result: Record<string, unknown> = {};

  for (const field of Object.values(parsed)) {
    if (!field.text) continue;
    const key = toSnakeCase(field.text);
    if (!key) continue;
    const { answer, prettyFormat } = field;

    if (prettyFormat) {
      result[key] = prettyFormat;
    } else if (
      typeof answer === 'string' ||
      typeof answer === 'number' ||
      typeof answer === 'boolean'
    ) {
      result[key] = answer;
    } else if (Array.isArray(answer)) {
      result[key] = answer.join(', ');
    } else if (answer !== null && answer !== undefined) {
      result[key] = Object.values(answer as Record<string, string>)
        .filter(Boolean)
        .join(' ');
    } else {
      result[key] = null;
    }
  }

  return result;
}

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
