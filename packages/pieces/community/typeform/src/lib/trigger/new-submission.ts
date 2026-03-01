import { typeformCommon, formsDropdown } from '../common';
import { nanoid } from 'nanoid';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { typeformAuth } from '../..';

export const typeformNewSubmission = createTrigger({
  auth: typeformAuth,
  name: 'new_submission',
  displayName: 'New Submission',
  description: 'Triggers when Typeform receives a new submission',
  props: {
    form_id: formsDropdown,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    form_id: 'o3TT4IlE',
    token: '9q3v9bp5alonta6239q3q1rfly2c2ukh',
    landed_at: '2023-01-29T20:52:35Z',
    submitted_at: '2023-01-29T20:52:37Z',
    definition: {
      id: 'o3TT4IlE',
      title: 'test2',
      fields: [
        {
          id: 'r2NV4a7LSugq',
          ref: '01GQZMFYAD53N13MC7G0AKFWC6',
          type: 'multiple_choice',
          title: '...',
          properties: {},
          choices: [
            {
              id: 'jNfSosecdD10',
              label: 'Choice 1',
            },
            {
              id: 'pCyKAWMwEbZH',
              label: 'Choice 2',
            },
          ],
        },
      ],
    },
    answers: [
      {
        type: 'choice',
        choice: {
          label: 'Choice 1',
        },
        field: {
          id: 'r2NV4a7LSugq',
          type: 'multiple_choice',
          ref: '01GQZMFYAD53N13MC7G0AKFWC6',
        },
      },
    ],
    thankyou_screen_ref: '01GQZMFYADET9MXFKPGFQG08T9',
  },
  async onEnable(context) {
    const randomTag = `ap_new_submission_${nanoid()}`;
    await typeformCommon.subscribeWebhook(
      context.propsValue['form_id']!,
      randomTag,
      context.webhookUrl,
      getAccessTokenOrThrow(context.auth)
    );
    await context.store?.put<WebhookInformation>('_new_submission_trigger', {
      tag: randomTag,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_submission_trigger'
    );
    if (response !== null && response !== undefined) {
      await typeformCommon.unsubscribeWebhook(
        context.propsValue['form_id']!,
        response.tag,
        getAccessTokenOrThrow(context.auth)
      );
    }
  },
  async run(context) {
    const body = context.payload.body as { form_response: unknown };
    return [body.form_response];
  },
});

interface WebhookInformation {
  tag: string;
}
