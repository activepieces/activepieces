import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders, leadIdDropdown, extractApiKey } from '../common/props';
import { isNil } from '@activepieces/shared';

export const updateLead = createAction({
  name: 'updateLead',
  displayName: 'Update Lead',
  description: 'Update a lead.',
  auth: bookedinAuth,
  props: {
    lead_id: leadIdDropdown,
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    handling_status: Property.ShortText({
      displayName: 'Handling Status',
      required: false,
    }),
    update_json: Property.Json({
      displayName: 'Update Payload (JSON)',
      description: 'Optional JSON body for complex updates. Merges with individual fields above.',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = extractApiKey(auth);
    const basePayload: Record<string, unknown> = {};

    if (!isNil(propsValue.firstName) || !isNil(propsValue.lastName) || !isNil(propsValue.email) || !isNil(propsValue.phone)) {
      const contact: Record<string, unknown> = {};

      const nameParts: Record<string, string> = {};
      if (!isNil(propsValue.firstName) && propsValue.firstName !== '') {
        nameParts['first'] = propsValue.firstName;
      }
      if (!isNil(propsValue.lastName) && propsValue.lastName !== '') {
        nameParts['last'] = propsValue.lastName;
      }
      if (Object.keys(nameParts).length > 0) {
        contact['name'] = nameParts;
      }

      if (!isNil(propsValue.email) && propsValue.email !== '') {
        contact['email'] = propsValue.email;
      }
      if (!isNil(propsValue.phone) && propsValue.phone !== '') {
        contact['number'] = propsValue.phone;
      }

      basePayload['contact'] = contact;
    }

    if (!isNil(propsValue.handling_status) && propsValue.handling_status !== '') {
      basePayload['handling_status'] = propsValue.handling_status;
    }

    const finalPayload = {
      ...basePayload,
      ...(propsValue.update_json || {}),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${BASE_URL}/leads/${propsValue.lead_id}`,
      headers: {
        ...getBookedinHeaders(apiKey),
        'Content-Type': 'application/json',
      },
      body: finalPayload,
    });

    return response.body;
  },
});