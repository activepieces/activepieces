import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../index';
import { callSevenApi } from '../common';

export const sendVoiceCallAction = createAction({
  auth: sevenAuth,
  name: 'send-voice-call',
  displayName: 'Send Voice Call',
  description: 'Creates a new Text-To-Speech call to a number.',
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
    }, 'voice', context.auth as string);

    return response.body;

  }
});
