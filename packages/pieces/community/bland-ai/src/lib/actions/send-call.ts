import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const sendCall = createAction({
  auth: blandAiAuth,
  name: 'send_call',
  displayName: 'Send Call',
  description: 'Initiate an AI phone call with a custom objective and actions.',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to call in E.164 format (e.g. +14155552671).',
      required: true,
    }),
    task: Property.LongText({
      displayName: 'Task',
      description:
        'Instructions for the AI agent. Include context, persona, and ideal conversation flow. Not needed if using a Pathway ID.',
      required: false,
    }),
    pathwayId: Property.ShortText({
      displayName: 'Pathway ID',
      description:
        'The ID of a conversation pathway created in the Bland AI portal. Overrides the task parameter.',
      required: false,
    }),
    voice: Property.ShortText({
      displayName: 'Voice',
      description:
        'Voice ID or preset name (e.g. "maya", "josh", "florian").',
      required: false,
    }),
    firstSentence: Property.ShortText({
      displayName: 'First Sentence',
      description:
        'A specific phrase for the AI to say as its opening line.',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The AI model to use for the call.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Base (recommended)', value: 'base' },
          { label: 'Turbo (fastest latency)', value: 'turbo' },
        ],
      },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'Language code (e.g. "en", "babel-en", "es", "fr", "de"). Defaults to "babel-en".',
      required: false,
    }),
    waitForGreeting: Property.Checkbox({
      displayName: 'Wait for Greeting',
      description:
        'When enabled, the AI waits for the recipient to speak first.',
      required: false,
      defaultValue: false,
    }),
    maxDuration: Property.Number({
      displayName: 'Max Duration (minutes)',
      description:
        'Maximum call length in minutes. The call ends automatically after this duration.',
      required: false,
    }),
    transferPhoneNumber: Property.ShortText({
      displayName: 'Transfer Phone Number',
      description:
        'A phone number the AI can transfer the call to in E.164 format.',
      required: false,
    }),
  },
  async run(context) {
    const {
      phoneNumber,
      task,
      pathwayId,
      voice,
      firstSentence,
      model,
      language,
      waitForGreeting,
      maxDuration,
      transferPhoneNumber,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      phone_number: phoneNumber,
    };

    if (task) body['task'] = task;
    if (pathwayId) body['pathway_id'] = pathwayId;
    if (voice) body['voice'] = voice;
    if (firstSentence) body['first_sentence'] = firstSentence;
    if (model) body['model'] = model;
    if (language) body['language'] = language;
    if (waitForGreeting) body['wait_for_greeting'] = true;
    if (maxDuration !== undefined && maxDuration !== null) {
      body['max_duration'] = Math.max(1, maxDuration);
    }
    if (transferPhoneNumber) body['transfer_phone_number'] = transferPhoneNumber;

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/calls',
      body,
    });
  },
});
