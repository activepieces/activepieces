import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import { famulorRequest, flattenCall } from '../common/client';
import { assistantDropdown, e164PhoneProperty, phoneNumberDropdown } from '../common/props';

const e164Pattern = /^\+[1-9]\d{4,19}$/;

export const makePhoneCall = createAction({
  auth: famulorAuth,
  name: 'makePhoneCall',
  displayName: 'Make Phone Call',
  description: 'Start an outbound call: the selected assistant dials the destination number.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Place one outbound call: a Famulor assistant dials an E.164 number. Use this to start a live call, not to list or inspect past calls. Optional lead is a data object (name, company), not Classic variables. Each call creates a new call record.',
    idempotent: false,
  },
  props: {
    assistant_id: assistantDropdown(true),
    to_number: e164PhoneProperty,
    phone_number_id: phoneNumberDropdown(false),
    lead: Property.Object({
      displayName: 'Lead data',
      description:
        'Optional fields the assistant can use during the call, for example name and company. This is not Classic 1.0 variables.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const toNumber = (propsValue.to_number ?? '').trim();
    if (!e164Pattern.test(toNumber)) {
      throw new Error('Phone number must be in E.164 format (e.g. +4930123456).');
    }

    const lead = propsValue.lead;
    const body: Record<string, unknown> = {
      assistant_id: propsValue.assistant_id,
      to_number: toNumber,
      phone_number_id: propsValue.phone_number_id || undefined,
      lead:
        lead && typeof lead === 'object' && Object.keys(lead).length > 0
          ? lead
          : undefined,
    };

    const response = await famulorRequest({
      auth,
      method: HttpMethod.POST,
      path: '/calls',
      body,
    });

    return flattenCall(response);
  },
});
