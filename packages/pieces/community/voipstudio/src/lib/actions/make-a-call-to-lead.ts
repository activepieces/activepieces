import { createAction, Property } from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const makeACallToLead = createAction({
  auth: voipstudioAuth,
  name: 'makeACallToLead',
  displayName: 'Make a Call to Lead',
  description: 'Make a leadcall from user to e164 number',
  props: {
    caller_id: Property.ShortText({
      displayName: 'Caller ID',
      description: 'Caller ID',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Destination number in e164 format or extension',
      required: true,
    }),
    tts: Property.ShortText({
      displayName: 'Text to Speech',
      description: 'Text to speech content',
      required: true,
    }),
  },
  async run(context) {
    const { caller_id, to, tts } = context.propsValue;

    const body = {
      caller_id,
      to,
      tts,
    };

    return await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/leadcalls',
      body
    );
  },
});
