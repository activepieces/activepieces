import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const sendCall = createAction({
  auth: blandAiAuth,
  name: 'send_call',
  displayName: 'Send Call',
  description: 'Initiate an AI phone call.',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to call in E.164 format.',
      required: true,
    }),
    task: Property.LongText({
      displayName: 'Task',
      description: 'Instructions for the AI agent.',
      required: true,
    }),
    firstSentence: Property.ShortText({
      displayName: 'First Sentence',
      description: 'Optional opening line for the call.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumber, task, firstSentence } = context.propsValue;
    const body: Record<string, unknown> = {
      phone_number: phoneNumber,
      task,
    };
    if (firstSentence) {
      body.first_sentence = firstSentence;
    }
    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/calls',
      body,
    });
  },
});
