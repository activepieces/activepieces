import { createAction, Property } from "@activepieces/pieces-framework";
import { shippoAuth } from "../../lib/auth";
import { ShippoClient } from "../../lib/client";

export const findOrder = createAction({
  name: 'find_order',
  displayName: 'Find Order',
  description: 'Search for an order by its ID',
  auth: shippoAuth,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to find',
      required: true,
    }),
  },
  async run(context) {
    const { order_id } = context.propsValue;

    const client = new ShippoClient({
      apiToken: context.auth.secret_text,
    });

    return await client.getOrder(order_id);
  },
});