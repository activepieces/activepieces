import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall, unwrapFirst } from '../common/client';

export const getLead = createAction({
  auth: nutshellAuth,
  name: 'getLead',
  displayName: 'Get Lead',
  description: 'Retrieves a lead by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Nutshell lead by its ID. Use to look up the current details of a known lead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to retrieve, e.g. "123-leads".',
      required: true,
    }),
  },
  async run(context) {
    const { leadId } = context.propsValue;
    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/leads/${leadId}`,
    });
    return unwrapFirst(response, 'leads');
  },
});
