import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistApiService } from '../common/requests';

export const addCustomVariablesOnLead = createAction({
  auth: lemlistAuth,
  name: 'addCustomVariablesOnLead',
  displayName: 'Add Custom Variables on Lead',
  description: 'Add new custom variables to a lead.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates new custom variables on a specific lead (identified by its Lemlist lead id) and sets each variable’s value for that lead. Variable names must be new — the call fails if a name matches a default field (email, firstName, lastName, picture, phone, linkedinUrl, companyName, companyDomain, icebreaker) or a previously created custom variable. Use to add extra mail-merge fields beyond the standard ones. Not idempotent: re-running with the same variable names returns an error.',
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
  async run({ auth, propsValue }) {
    const { leadId, customVariables } = propsValue;

    return await lemlistApiService.addLeadVariables(auth, {
      leadId,
      variables: customVariables ?? {},
    });
  },
});
