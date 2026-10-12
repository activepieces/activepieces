import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import {
  GqlRequestedOrderEdit,
  requestedOrderEditFields,
  requestedOrderEditHelpers,
} from '../../common/requested-order-edits';
import { requestedOrderEditOutputSchema } from '../../output-schemas/requested-order-edits';

export const shopifyAiDeclineRequestedOrderEdit = createAction({
  auth: shopifyAuth,
  name: 'decline_requested_order_edit',
  classification: 'WRITE',
  displayName: 'Decline Requested Order Edit',
  description: 'Decline a buyer request to edit an order, with an optional note to the buyer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Declines one pending (status REQUESTED) buyer-requested order edit; the order itself is not changed and the status becomes DECLINED. The optional decline_note (up to 500 characters) is the message Shopify sends to the buyer about the decline. Get the requested_order_edit_id from list_requested_order_edits. Needs the write_orders access scope. Not idempotent: an edit that is already declined or resolved is rejected, so check its status with list_requested_order_edits before retrying.',
    idempotent: false,
  },
  outputSchema: requestedOrderEditOutputSchema,
  props: {
    requested_order_edit_id: Property.ShortText({
      displayName: 'Requested Order Edit ID',
      description:
        'The requested order edit id, numeric or "gid://shopify/RequestedOrderEdit/…". Find it with list_requested_order_edits.',
      required: true,
    }),
    decline_note: Property.LongText({
      displayName: 'Decline Note',
      description: `Message sent to the buyer explaining the decline, at most ${requestedOrderEditFields.DECLINE_NOTE_MAX_LENGTH} characters. Leave empty to send none.`,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = requestedOrderEditHelpers.readTypedId({
      type: 'RequestedOrderEdit',
      value: propsValue.requested_order_edit_id,
      label: 'requested_order_edit_id',
    });
    const declineNote = requestedOrderEditHelpers.readDeclineNote(propsValue.decline_note);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      requestedOrderEditDecline: { requestedOrderEdit: GqlRequestedOrderEdit | null } | null;
    }>({
      auth,
      query: `mutation DeclineRequestedOrderEdit($input: RequestedOrderEditDeclineInput!) { requestedOrderEditDecline(input: $input) { requestedOrderEdit { ${requestedOrderEditFields.REQUESTED_ORDER_EDIT_FIELDS} } userErrors { field message code } } }`,
      variables: { input: shopifyValues.compact({ id, declineNote }) },
      primaryPaths: ['requestedOrderEditDecline.requestedOrderEdit'],
    });
    const edit = data.requestedOrderEditDecline?.requestedOrderEdit;
    if (!edit) {
      throw new Error(
        `Shopify did not return requested order edit ${id}. Check its status with list_requested_order_edits before retrying.`
      );
    }
    return {
      ...requestedOrderEditHelpers.mapRequestedOrderEdit(edit),
      redacted_fields: redactedFields,
    };
  },
});
