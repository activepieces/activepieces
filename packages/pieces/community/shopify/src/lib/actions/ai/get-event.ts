import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlEvent,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { eventOutputSchema } from '../../output-schemas/store';

export const shopifyAiGetEvent = createAction({
  auth: shopifyAuth,
  name: 'get_event',
  classification: 'READ',
  displayName: 'Get Store Event',
  description: 'Get one store activity-log event.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one store event: its action (for example create, update, destroy, published), message, subject id and type for basic events or the raw comment text for staff comments, the app that caused it and when it happened. A numeric id is read as a basic event; pass the full "gid://shopify/CommentEvent/…" id for a staff comment. Find ids with list_events. No dedicated access scope is documented; the read scope of the event\'s subject is expected to apply (not yet confirmed on a store). Read-only.',
    idempotent: true,
  },
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The event id, numeric (a basic event) or a full id such as "gid://shopify/BasicEvent/422690323" or "gid://shopify/CommentEvent/…". Find it with list_events.',
      required: true,
    }),
  },
  outputSchema: eventOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'BasicEvent', id: propsValue.event_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      event: GqlEvent | null;
    }>({
      auth,
      query: `query GetEvent($id: ID!) { event(id: $id) { ${shopifyFields.EVENT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.event) {
      throw new Error(`Event ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapEvent(data.event),
      redacted_fields: redactedFields,
    };
  },
});
