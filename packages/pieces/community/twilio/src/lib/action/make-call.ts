import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioMakeCall = createAction({
  auth: twilioAuth,
  name: 'make_call',
  classification: 'WRITE',
  description: 'Call a number and read a message aloud.',
  audience: 'both',
  aiMetadata: { description: 'Places an outbound voice call from a Twilio number that reads a text-to-speech message to the recipient. Use to deliver a spoken notification or alert by phone. Requires both numbers in E.164 format and the message text; each call places a real, billable phone call, so it is not idempotent.', idempotent: false },
  displayName: 'Call Phone',
  props: {
    from: twilioCommon.phoneNumberDropdown({
      displayName: 'From',
      description: 'Your Twilio number the call comes from.',
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Phone number with country code, starting with +.',
      required: true,
      placeholder: '+15558675310',
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Text read aloud to the person who answers.',
      required: true,
      placeholder: 'Hi, this is a reminder about your appointment tomorrow.',
    }),
    voice: Property.StaticDropdown({
        displayName: 'Voice',
        description: "Empty: your Twilio account's default voice.",
        required: false,
        options: {
            options: [
                { label: 'Alice', value: 'alice' },
                { label: 'Man', value: 'man' },
                { label: 'Woman', value: 'woman' },
            ]
        }
    }),
    language: Property.StaticDropdown({
        displayName: 'Language',
        description: 'Language the message is read in. Empty: English (US).',
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
      displayName: 'Keys to Dial',
      description: 'Keys pressed once the call connects. w pauses 0.5 s, W pauses 1 s.',
      required: false,
      placeholder: 'W1234#',
      advanced: true,
    }),
    timeout: Property.Number({
        displayName: 'Ring Timeout',
        description: 'Seconds to ring before giving up, up to 600. Empty: 60.',
        required: false,
        advanced: true,
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