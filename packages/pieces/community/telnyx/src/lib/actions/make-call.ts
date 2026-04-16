import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { telnyxAuth } from '../auth';
import { telnyxRequest } from '../common/client';

export const makeCallAction = createAction({
  auth: telnyxAuth,
  name: 'make_call',
  displayName: 'Make Call',
  description: 'Initiate an outbound call using the Telnyx Call Control API.',
  props: {
    connection_id: Property.ShortText({
      displayName: 'Connection ID',
      description:
        'The Telnyx Call Control Application ID (formerly connection ID) used to place the call.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'The caller ID number in E.164 format.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The destination number or SIP URI.',
      required: true,
    }),
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description:
        'Optional WAV or MP3 URL to play when the call is answered.',
      required: false,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description:
        'Optional URL that overrides the default Telnyx webhook destination for this call.',
      required: false,
    }),
    timeout_secs: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'How long to let the destination ring before timing out.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const { connection_id, from, to, audio_url, webhook_url, timeout_secs } =
      context.propsValue;

    return await telnyxRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/calls',
      body: {
        connection_id,
        from,
        to,
        ...(audio_url ? { audio_url } : {}),
        ...(webhook_url ? { webhook_url } : {}),
        ...(timeout_secs ? { timeout_secs } : {}),
      },
    });
  },
});
