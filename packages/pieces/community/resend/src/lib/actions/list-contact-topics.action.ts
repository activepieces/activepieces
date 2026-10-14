import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { listContactTopicsOutputSchema } from '../output-schemas';

export const listContactTopics = createAction({
  name: 'list_contact_topics',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Contact Topics',
  outputSchema: listContactTopicsOutputSchema,
  description: "List a contact's topic subscriptions",
  audience: 'ai',
  aiMetadata: { description: "Retrieves every topic a contact (identified by ID or email) is associated with, along with their opt-in/opt-out status for each. Use this to check a contact's topic preferences before sending topic-scoped broadcasts. Read-only and idempotent.", idempotent: true },
  props: {
    contact_identifier: resendProps.contactIdentifier,
  },
  async run({ auth, propsValue }) {
    const response = await resendClient.sendRequest<{
      data: { id: string; name: string; description: string; subscription: string }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: `/contacts/${encodeURIComponent(propsValue.contact_identifier)}/topics` });
    return response.data;
  },
});
