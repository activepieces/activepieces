import { createAction, Property } from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const makeACallToLead = createAction({
  auth: voipstudioAuth,
  name: 'makeACallToLead',
  displayName: 'Make a Call to Lead',
  description: 'Make a leadcall from user to e164 number',
  audience: 'both',
  aiMetadata: {
    description:
      "Places an outbound lead call to a destination number (E.164 or extension) and plays a text-to-speech message; all three inputs (caller ID, destination, TTS text) are required. Choose this for automated outreach calls that announce a spoken message rather than connecting two people. Not idempotent: each call initiates a new phone call.",
    idempotent: false,
  },
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
