import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../lib/auth';
import { callSevenApi } from '../common';

export const sendVoiceCallAction = createAction({
  auth: sevenAuth,
  name: 'send-voice-call',
  displayName: 'Send Voice Call',
  description: 'Creates a new Text-To-Speech call to a number.',
  audience: 'both',
  aiMetadata: {
    description: 'Places an automated Text-To-Speech voice call via the seven gateway to one or more recipient numbers, reading out the provided message text. Use to deliver a spoken notification rather than a text message; an optional custom sender can be set. Each call initiates a new outbound call, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    to: Property.ShortText({
      description: 'Recipient number(s) of the voice calls.',
      displayName: 'To',
      required: true
    }),
    from: Property.ShortText({
      displayName: 'From',
      required: false
    }),
    text: Property.LongText({
      displayName: 'Message Body',
      description: 'Text message to be read out.',
      required: true
    }),

  },
  async run(context) {
    const { from, text, to } = context.propsValue;

    const response= await callSevenApi({
      body: {
        from,
        text,
        to
      },
      method: HttpMethod.POST
    }, 'voice', context.auth.secret_text);

    return response.body;

  }
});
