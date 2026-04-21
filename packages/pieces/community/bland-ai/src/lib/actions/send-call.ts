import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const sendCall = createAction({
  auth: blandAiAuth,
  name: 'send_call',
  displayName: 'Send Call',
  description: 'Initiate an AI phone call to a recipient.',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The number to call in E.164 format (e.g. +12223334444). Must include the country code.',
      required: true,
    }),
    task: Property.LongText({
      displayName: 'Task',
      description:
        'Instructions for the AI agent — what it should say, ask, or accomplish during the call. Not required if using a Pathway ID.',
      required: false,
    }),
    pathwayId: Property.ShortText({
      displayName: 'Pathway ID',
      description:
        'UUID of a pre-built Pathway from your Bland AI dashboard. When provided, it overrides the Task field. Find it in the Pathways section of your dashboard.',
      required: false,
    }),
    firstSentence: Property.ShortText({
      displayName: 'First Sentence',
      description: "Exact opening line the agent will say when the call is answered. Leave blank to let the agent decide.",
      required: false,
    }),
    voice: Property.StaticDropdown({
      displayName: 'Voice',
      description: 'The voice the AI agent will use. Choose from Bland AI preset voices optimised for phone quality.',
      required: false,
      defaultValue: 'maya',
      options: {
        options: [
          { label: 'Maya — Young American Female', value: 'maya' },
          { label: 'Ryan — Professional American Male', value: 'ryan' },
          { label: 'Mason — American Male', value: 'mason' },
          { label: 'Tina — Gentle American Female', value: 'tina' },
          { label: 'Josh — American Male', value: 'josh' },
          { label: 'Florian', value: 'florian' },
          { label: 'Derek', value: 'derek' },
          { label: 'June', value: 'june' },
          { label: 'Nat', value: 'nat' },
          { label: 'Paige', value: 'paige' },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        '"Base" is the standard model. "Turbo" is faster with lower latency, recommended for time-sensitive conversations.',
      required: false,
      defaultValue: 'base',
      options: {
        options: [
          { label: 'Base (standard)', value: 'base' },
          { label: 'Turbo (lower latency)', value: 'turbo' },
        ],
      },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'Language code for transcription and speech (e.g. "en", "es", "fr"). Defaults to "babel-en" (English with accent tolerance).',
      required: false,
    }),
    maxDuration: Property.Number({
      displayName: 'Max Duration (minutes)',
      description: 'Maximum call length in minutes. The call ends automatically after this time. Defaults to 30.',
      required: false,
      defaultValue: 30,
    }),
    waitForGreeting: Property.Checkbox({
      displayName: 'Wait for Greeting',
      description:
        'When enabled, the AI waits for the recipient to speak first before responding. Useful when calling into IVR systems.',
      required: false,
      defaultValue: false,
    }),
    record: Property.Checkbox({
      displayName: 'Record Call',
      description: 'When enabled, the call is recorded. The recording URL is included in the post-call data.',
      required: false,
      defaultValue: false,
    }),
    transferPhoneNumber: Property.ShortText({
      displayName: 'Transfer Phone Number',
      description:
        'E.164 phone number to transfer the call to if the AI decides a human is needed (e.g. +12223334444).',
      required: false,
    }),
    webhook: Property.ShortText({
      displayName: 'Webhook URL',
      description:
        'URL that receives a POST request with full call data (transcript, summary, recording URL) after the call ends.',
      required: false,
    }),
    summaryPrompt: Property.LongText({
      displayName: 'Summary Prompt',
      description:
        'Custom instructions for how the post-call summary should be written (max 2000 characters). Leave blank to use the default summary format.',
      required: false,
    }),
  },
  async run(context) {
    const {
      phoneNumber,
      task,
      pathwayId,
      firstSentence,
      voice,
      model,
      language,
      maxDuration,
      waitForGreeting,
      record,
      transferPhoneNumber,
      webhook,
      summaryPrompt,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      phone_number: phoneNumber,
    };

    if (task) body['task'] = task;
    if (pathwayId) body['pathway_id'] = pathwayId;
    if (firstSentence) body['first_sentence'] = firstSentence;
    if (voice) body['voice'] = voice;
    if (model) body['model'] = model;
    if (language) body['language'] = language;
    if (maxDuration !== undefined && maxDuration !== null) body['max_duration'] = maxDuration;
    if (waitForGreeting !== undefined) body['wait_for_greeting'] = waitForGreeting;
    if (record !== undefined) body['record'] = record;
    if (transferPhoneNumber) body['transfer_phone_number'] = transferPhoneNumber;
    if (webhook) body['webhook'] = webhook;
    if (summaryPrompt) body['summary_prompt'] = summaryPrompt;

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/calls',
      body,
    });
  },
});
