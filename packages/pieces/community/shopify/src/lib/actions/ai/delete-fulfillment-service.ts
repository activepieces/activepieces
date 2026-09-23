import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiDeleteFulfillmentService = createAction({
  auth: shopifyAuth,
  name: 'delete_fulfillment_service',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Fulfillment Service',
  description: 'Delete a fulfillment service and decide what happens to its location\'s inventory.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one fulfillment service. Only services created by this app can be deleted. inventory_action is required and always sent (Shopify\'s silent default would be TRANSFER): TRANSFER moves the service location\'s inventory and commitments to destination_location_id (required, an active merchant-managed location); KEEP keeps the location and its inventory; DELETE removes the location together with its inventory records (the saved docs give no per-value detail for KEEP and DELETE, so prefer TRANSFER when stock must survive). Cannot be undone; a repeat call fails because the service is gone. Needs the write_fulfillments access scope.',
    idempotent: false,
  },
  props: {
    fulfillment_service_id: Property.ShortText({
      displayName: 'Fulfillment Service ID',
      description:
        'The fulfillment service, numeric or "gid://shopify/FulfillmentService/…". Find it with list_fulfillment_services.',
      required: true,
    }),
    inventory_action: Property.StaticDropdown({
      displayName: 'Inventory Action',
      description:
        'What happens to the service location and its inventory: TRANSFER to another location, KEEP as a regular location, or DELETE.',
      required: true,
      options: {
        options: [
          { label: 'Transfer inventory to another location', value: 'TRANSFER' },
          { label: 'Keep the location and its inventory', value: 'KEEP' },
          { label: 'Delete the location and its inventory', value: 'DELETE' },
        ],
      },
    }),
    destination_location_id: Property.ShortText({
      displayName: 'Destination Location ID',
      description:
        'Required with TRANSFER, not allowed otherwise: the active merchant-managed location that receives the inventory, numeric or "gid://shopify/Location/…". Find it with list_locations.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentService', id: propsValue.fulfillment_service_id });
    const inventoryAction = propsValue.inventory_action;
    const destination = shopifyValues.nonEmpty(propsValue.destination_location_id);
    if (inventoryAction === 'TRANSFER' && !destination) {
      throw new Error(
        'inventory_action TRANSFER needs destination_location_id (the location that receives the inventory). Nothing was changed.'
      );
    }
    if (inventoryAction !== 'TRANSFER' && destination) {
      throw new Error(
        `destination_location_id applies only to TRANSFER; with ${inventoryAction} leave it empty. Nothing was changed.`
      );
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentServiceDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteFulfillmentService($id: ID!, $inventoryAction: FulfillmentServiceDeleteInventoryAction!, $destinationLocationId: ID) { fulfillmentServiceDelete(id: $id, inventoryAction: $inventoryAction, destinationLocationId: $destinationLocationId) { deletedId userErrors { field message } } }`,
      variables: {
        id,
        inventoryAction,
        destinationLocationId: destination
          ? shopifyGraphqlClient.toGid({ type: 'Location', id: destination })
          : undefined,
      },
    });
    return {
      deleted_id: data.fulfillmentServiceDelete?.deletedId ?? id,
      inventory_action: inventoryAction,
      redacted_fields: redactedFields,
    };
  },
});
