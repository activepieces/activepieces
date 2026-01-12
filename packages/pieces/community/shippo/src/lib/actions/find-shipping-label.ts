import { createAction, Property } from "@activepieces/pieces-framework";
import { shippoAuth } from "../../lib/auth";
import { ShippoClient } from "../../lib/client";

export const findShippingLabel = createAction({
  name: 'find_shipping_label',
  displayName: 'Find Shipping Label',
  description: 'Search for a shipping label by its ID',
  auth: shippoAuth,
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the shipping label to find',
      required: true,
    }),
  },
  async run(context) {
    const { label_id } = context.propsValue;

    const client = new ShippoClient({
      apiToken: context.auth.secret_text,
    });

    return await client.getShippingLabel(label_id);
  },
});