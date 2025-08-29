import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioCallPhone = createAction({
  auth: twilioAuth,
  name: 'call_phone',
  displayName: 'Call Phone',
  description: 'Place a phone call with text-to-speech message',
  props: {
    from: twilioCommon.phone_number,
    to: Property.ShortText({
      displayName: 'To',
      description: 'The phone number to call (in E.164 format, e.g., +1234567890)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The text-to-speech message to play during the call',
      required: true,
    }),
    voice: Property.StaticDropdown({
      displayName: 'Voice',
      description: 'The voice to use for text-to-speech',
      required: false,
      defaultValue: 'alice',
      options: {
        disabled: false,
        options: [
          { label: 'Alice', value: 'alice' },
          { label: 'Man', value: 'man' },
          { label: 'Woman', value: 'woman' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'The language for text-to-speech',
      required: false,
      defaultValue: 'en',
      options: {
        disabled: false,
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
        ],
      },
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'The number of seconds to wait for the call to be answered (default: 60)',
      required: false,
      defaultValue: 60,
    }),
    record: Property.Checkbox({
      displayName: 'Record Call',
      description: 'Whether to record the call',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { from, to, message, voice = 'alice', language = 'en', timeout = 60, record = false } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${message.replace(/[<>&"']/g, (match) => {
    const escapeMap: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;'
    };
    return escapeMap[match];
  })}</Say>
</Response>`;

    const callData: any = {
      From: from,
      To: to,
      Twiml: twiml,
      Timeout: timeout.toString(),
    };

    if (record) {
      callData.Record = 'true';
    }

    return await callTwilioApi(
      HttpMethod.POST,
      'Calls.json',
      { account_sid, auth_token },
      callData
    );
  },
});
