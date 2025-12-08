import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders } from '../common/props';
import { isNil } from '@activepieces/shared';

export const updateLead = createAction({
  name: 'updateLead',
  displayName: 'Update Lead',
  description: 'Update a lead.',
  auth: bookedinAuth,
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to update (e.g., cus_...)',
      required: true,
    }),
    // --- Common Update Fields ---
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone Number', required: false }),
    handling_status: Property.ShortText({ displayName: 'Handling Status', required: false }),
    
    // --- Advanced Update (Full JSON) ---
    update_json: Property.Json({
      displayName: 'Update Payload (JSON)',
      description: 'Optional. Use this to provide the full or partial JSON body for complex updates. This will merge with/override the individual fields above.',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {

    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

    // 1. Build base payload dynamically
    // We ONLY add fields if they are not null/undefined/empty
    const basePayload: any = {};

    // Check if we have any contact info to update
    if (!isNil(propsValue.firstName) || !isNil(propsValue.lastName) || !isNil(propsValue.email) || !isNil(propsValue.phone)) {
        basePayload.contact = {
            name: {},
        };
        // Only add specific fields if they exist
        if (!isNil(propsValue.firstName) && propsValue.firstName !== '') {
            basePayload.contact.name.first = propsValue.firstName;
        }
        if (!isNil(propsValue.lastName) && propsValue.lastName !== '') {
            basePayload.contact.name.last = propsValue.lastName;
        }
        if (!isNil(propsValue.email) && propsValue.email !== '') {
            basePayload.contact.email = propsValue.email;
        }
        if (!isNil(propsValue.phone) && propsValue.phone !== '') {
            basePayload.contact.number = propsValue.phone;
        }

        // Clean up empty name object if no name parts were added
        if (Object.keys(basePayload.contact.name).length === 0) {
            delete basePayload.contact.name;
        }
    }

    if (!isNil(propsValue.handling_status) && propsValue.handling_status !== '') {
        basePayload.handling_status = propsValue.handling_status;
    }

    // 2. Merge with the JSON payload provided by the user
    const finalPayload = {
        ...basePayload,
        ...(propsValue.update_json || {}),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${BASE_URL}/leads/${propsValue.lead_id}`,
      headers: {
        ...getBookedinHeaders(apiKey as string),
        'Content-Type': 'application/json',
      },
      body: finalPayload,
    });

    return response.body;
  },
});