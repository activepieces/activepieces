import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../index';
import { callSevenApi } from '../common';

export const ttsCall = createAction({
  auth: sevenAuth,
  name: 'tts_call',
  description: 'Convert text to speech, call number and read text out loud',
  displayName: 'Text-To-Speech Call',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      required: false
    }),
    text: Property.LongText({
      description: 'The message to convert to speech',
      displayName: 'Message Body',
      required: true
    }),
    to: Property.ShortText({
      description: 'The phone number for calling',
      displayName: 'To',
      required: true
    })
  },
  async run(context) {
    const { from, text, to } = context.propsValue;

    return await callSevenApi({
      body: {
        from,
        text,
        to
      },
      method: HttpMethod.POST
    }, 'voice', context.auth as string);

  }
});
