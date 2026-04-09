import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const updateLeadAction = createAction({
  auth: instantlyAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead in Instantly.',
  props: {
    lead_id: instantlyProps.leadId(true),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    custom_variables: Property.Json({
      displayName: 'Custom Variables',
      description:
        'Custom variables for the lead as a JSON object. Values must be strings, numbers, booleans, or null.',
      required: false,
    }),
  },
  async run(context) {
    const { lead_id, custom_variables, ...fields } = context.propsValue;

    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null && value !== '') {
        body[key] = value;
      }
    }
    if (custom_variables) {
      body['custom_variables'] = custom_variables;
    }

    return instantlyClient.makeRequest<InstantlyLead>({
      auth: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `leads/${lead_id}`,
      body,
    });
  },
});
