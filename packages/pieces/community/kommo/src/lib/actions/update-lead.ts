import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common";
import { kommoAuth } from "../../index";


export const updateLeadAction = createAction({
  auth: kommoAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Update existing lead info.',
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
    }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      required: false,
    }),
    price: Property.Number({
      displayName: 'New Price',
      required: false,
    })
  },
  async run(context) {
    const { leadId, name, status_id, price } = context.propsValue;
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const updateData = { name, status_id, price };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.PATCH,
      `/leads/${leadId}`,
      updateData
    );

    return result;
  },
});
