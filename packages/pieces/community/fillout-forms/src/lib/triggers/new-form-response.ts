import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { formIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'new-form-response-trigger';

export const newFormResponse = createTrigger({
  auth: filloutFormsAuth,
  name: 'new-form-response',
  displayName: 'New Form Response',
  description:
    'Triggers when a new submission is received for a selected Fillout form.',
  props: {
    formId: formIdDropdown,
  },

  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { formId } = context.propsValue;
    const apiKey = context.auth as string;

    const response = (await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/webhook/create',
      undefined,
      {
        formId,
        url: context.webhookUrl,
      }
    )) as { id: number };

    await context.store.put<number>(TRIGGER_KEY, response.id);
  },
  async onDisable(context) {
    const apiKey = context.auth as string;

    const webhookId = await context.store.get<number>(TRIGGER_KEY);
    if (!isNil(webhookId)) {
      await makeRequest(apiKey, HttpMethod.POST, '/webhook/delete', undefined, {
        webhookId,
      });
    }
  },
  async test(context) {
    const { formId } = context.propsValue;
    const apiKey = context.auth as string;

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/submissions`,
      {
        limit: '10',
        sort: 'desc',
      }
    );

    const submissions = response as { responses: Record<string, any>[] };

    return submissions.responses;
  },
  async run(context) {
    const payload = JSON.parse(context.payload.body as string) as {
      submission: Record<string, any>;
    };
    return [payload.submission];
  },
  sampleData: {
    questions: [
      {
        id: '5AtgG35AAZVcrSVfRubvp1',
        name: 'What is your name?',
        type: 'ShortAnswer',
        value: 'John Doe',
      },
      {
        id: 'gRBWVbE2fut2oiAMprdZpY',
        name: 'What is your email?',
        type: 'Email',
        value: 'john@example.com',
      },
      {
        id: 'hP4bHA1CgvyD2LKhBnnGHy',
        name: 'Pick your favorite color',
        type: 'MultipleChoice',
        value: 'Blue',
      },
    ],
    calculations: [
      {
        id: 'abcdef',
        name: 'Price',
        type: 'number',
        value: '12.50',
      },
    ],
    urlParameters: [
      {
        id: 'email',
        name: 'email',
        value: 'john@example.com',
      },
    ],
    submissionId: 'abc123',
    submissionTime: '2024-05-16T23:20:05.324Z',
  },
});
