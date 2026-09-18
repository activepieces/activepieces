import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const updateLeadAction = createAction({
  auth: instantlyAuth,
  name: 'update_lead',
  classification: 'WRITE',
  displayName: 'Update Lead',
  description: 'Updates an existing lead in Instantly.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Instantly lead by lead ID, changing only the fields supplied (first name, last name, company, phone, website, custom variables); fields left empty are not sent and keep their current values. Use to enrich or correct a known lead. Idempotent — applying the same values repeatedly leaves the lead in the same state.', idempotent: true },
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
    custom_variables: Property.Object({
      displayName: 'Custom Variables',
      description:
        'Extra fields to store on the lead, as name and value pairs. You can use them as variables in your Instantly emails.',
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
    if (custom_variables && Object.keys(custom_variables).length > 0) {
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
