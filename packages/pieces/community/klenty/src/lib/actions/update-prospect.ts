import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { klentyRequest } from '../common/client';
import { buildProspectPayload, prospectCommonProps } from '../common/props';

export const updateProspectAction = createAction({
  name: 'update_prospect',
  displayName: 'Update Prospect',
  description: 'Update an existing prospect in Klenty by email address.',
  audience: 'both',
  aiMetadata: {
    description:
      "Updates an existing Klenty prospect identified by their current email address, overwriting the supplied contact fields (including optionally a new email). Use to edit a known prospect's details rather than create one. Idempotent: the prospect is keyed on the current email, so repeating the call with the same input yields the same record.",
    idempotent: true,
  },
  auth: klentyAuth,
  props: {
    currentEmail: Property.ShortText({
      displayName: 'Current Prospect Email',
      description: 'The current email used to identify the prospect in Klenty.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'New Email',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    ...prospectCommonProps,
  },
  async run({ auth, propsValue }) {
    const response = await klentyRequest({
      auth,
      method: HttpMethod.POST,
      path: `/prospects/${encodeURIComponent(String(propsValue.currentEmail))}`,
      body: buildProspectPayload(propsValue),
    });

    return response;
  },
});
