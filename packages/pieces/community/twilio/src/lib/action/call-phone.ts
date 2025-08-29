import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioCallPhone = createAction({
  auth: twilioAuth,
  name: 'call_phone',
  description: 'Place a phone call with text-to-speech message, DTMF support, and machine detection',
  displayName: 'Call Phone',
  props: {
    from: twilioCommon.phone_number,
    to: Property.ShortText({
      description: 'The phone number to call',
      displayName: 'To',
      required: true,
    }),
    url: Property.ShortText({
      description: 'URL that returns TwiML instructions for the call (required for outbound calls)',
      displayName: 'TwiML URL',
      required: false,
    }),
    twiml: Property.LongText({
      description: 'TwiML to execute when the call connects (alternative to URL)',
      displayName: 'TwiML',
      required: false,
    }),
    say_message: Property.LongText({
      description: 'Message to speak using text-to-speech (used if TwiML is not provided)',
      displayName: 'Message to Say',
      required: false,
    }),
    voice: Property.StaticDropdown({
      description: 'Voice to use for text-to-speech',
      displayName: 'Voice',
      required: false,
      defaultValue: 'alice',
      options: {
        options: [
          { label: 'Alice', value: 'alice' },
          { label: 'Man', value: 'man' },
          { label: 'Woman', value: 'woman' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      description: 'Language for text-to-speech',
      displayName: 'Language',
      required: false,
      defaultValue: 'en',
      options: {
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
      description: 'Time in seconds to wait for the call to be answered (default: 60)',
      displayName: 'Timeout',
      required: false,
      defaultValue: 60,
    }),
    record: Property.Checkbox({
      description: 'Record the call',
      displayName: 'Record Call',
      required: false,
      defaultValue: false,
    }),
    send_digits: Property.ShortText({
      description: 'DTMF tones to send after the call connects (digits 0-9, *, #, w=0.5s pause, W=1s pause)',
      displayName: 'Send Digits (DTMF)',
      required: false,
    }),
    machine_detection: Property.StaticDropdown({
      description: 'Enable answering machine detection',
      displayName: 'Machine Detection',
      required: false,
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Enable', value: 'Enable' },
          { label: 'DetectMessageEnd', value: 'DetectMessageEnd' },
        ],
      },
    }),
  },
  async run(context) {
    const { 
      from, 
      to, 
      url, 
      twiml, 
      say_message, 
      voice = 'alice', 
      language = 'en', 
      timeout = 60, 
      record = false,
      send_digits,
      machine_detection
    } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const callData: any = {
      From: from,
      To: to,
      Timeout: timeout,
    };

    if (url) {
      callData.Url = url;
    } else if (twiml) {
      callData.Twiml = twiml;
    } else if (say_message) {
      const callTwiML = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${voice}" language="${language}">${say_message}</Say></Response>`;
      callData.Twiml = callTwiML;
    } else {
      throw new Error('Either URL, TwiML, or Say Message must be provided');
    }

    if (record) {
      callData.Record = true;
    }

    if (send_digits) {
      callData.SendDigits = encodeURIComponent(send_digits);
    }

    if (machine_detection && machine_detection !== 'none') {
      if (send_digits) {
        console.warn('Warning: MachineDetection is ignored when SendDigits is provided');
      } else {
        callData.MachineDetection = machine_detection;
      }
    }

    return await callTwilioApi(
      HttpMethod.POST,
      'Calls.json',
      { account_sid, auth_token },
      callData
    );
  },
});
