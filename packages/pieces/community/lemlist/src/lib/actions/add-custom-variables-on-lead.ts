import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const addCustomVariablesOnLead = createAction({
  auth: lemlistAuth,
  name: 'addCustomVariablesOnLead',
  classification: 'WRITE',
  displayName: 'Add Custom Variables on Lead',
  description: 'Add new custom variables to a lead.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates new custom variables on one lead (Lemlist lead ID lea_...) and sets their values. Names must be new: the call fails with a conflict if a name matches a default field (email, firstName, lastName, picture, phone, linkedinUrl, companyName, companyDomain, icebreaker) or an existing custom variable; use Update Lead Variables to change existing values. company-prefixed names write to the shared company record. Not idempotent: a second run with the same names fails.',
    idempotent: false,
  },
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description:
        'The unique identifier of the lead (e.g. lea_8xJSc7sV7ggpiVnXe). Available as the _id field returned by the Add Lead To A Campaign and Search Lead actions.',
      required: true,
    }),
    customVariables: Property.Object({
      displayName: 'Custom Variables',
      description:
        'New custom variables to create on the lead. Each key is the variable name and each value is its content. Names must not match an existing default or custom variable.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.variables,
  async run({ auth, propsValue }) {
    return lemlistLeads.writeLeadVariables({
      apiKey: auth.secret_text,
      leadId: propsValue.leadId,
      variables: propsValue.customVariables,
      method: HttpMethod.POST,
    });
  },
});
