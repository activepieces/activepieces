import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioMakeCall = createAction({
  auth: twilioAuth,
  name: 'make_call',
  description: 'Call a number and say a message.',
  displayName: 'Call Phone',
  props: {
    from: twilioCommon.phone_number,
    to: Property.ShortText({
      displayName: 'To',
      description: 'The phone number to call. Must be in E.164 format (e.g., +15558675310).',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message to Say',
      description: 'The text message to be converted to speech and spoken to the recipient.',
      required: true,
    }),
    voice: Property.StaticDropdown({
        displayName: 'Voice',
        description: 'The voice to use for the text-to-speech message.',
        required: false,
        options: {
            options: [
                { label: 'Alice (Default)', value: 'alice' },
                { label: 'Man', value: 'man' },
                { label: 'Woman', value: 'woman' },
            ]
        }
    }),
    language: Property.StaticDropdown({
        displayName: 'Language',
        description: 'The language to use for the text-to-speech message.',
        required: false,
        options: {
            options: [
                { label: 'English (US)', value: 'en-US' },
                { label: 'English (UK)', value: 'en-GB' },
                { label: 'Spanish', value: 'es-ES' },
                { label: 'French', value: 'fr-FR' },
                { label: 'German', value: 'de-DE' },
            ]
        }
    }),
    sendDigits: Property.ShortText({
      displayName: 'Send DTMF Tones',
      description: "A string of keys to dial after the call is connected. Use 'w' for a half-second pause.",
      required: false,
    }),
    timeout: Property.Number({
        displayName: 'Timeout (seconds)',
        description: 'The number of seconds to let the phone ring before assuming no answer. Default is 60.',
        required: false,
    })
  },
  async run(context) {
    const { from, to, message, voice, language, sendDigits, timeout } = context.propsValue;

    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    // Construct TwiML for the <Say> verb
    const voiceAttr = voice ? ` voice="${voice}"` : '';
    const langAttr = language ? ` language="${language}"` : '';
    const escapedMessage = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const twiml = `<Response><Say${voiceAttr}${langAttr}>${escapedMessage}</Say></Response>`;

    const bodyParams: Record<string, unknown> = {
      From: from,
      To: to,
      Twiml: twiml,
    };

    if (sendDigits) {
      bodyParams['SendDigits'] = sendDigits;
    }
    if (timeout) {
      bodyParams['Timeout'] = timeout;
    }

    const response =  await callTwilioApi(
      HttpMethod.POST,
      'Calls.json',
      { account_sid, auth_token },
      bodyParams
    );

    return response.body;
  },
});