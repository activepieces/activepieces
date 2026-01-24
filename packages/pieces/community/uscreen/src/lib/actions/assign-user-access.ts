import { createAction, Property } from "@activepieces/pieces-framework";
import { uscreenAuth } from "../common/auth";
import { uscreenProps } from "../common/props";
import { UscreenClient } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";

export const assignUserAccess = createAction({
    auth: uscreenAuth,
    name: 'assign_user_access',
    displayName: 'Assign User Access',
    description: "Assigns a bundle or subscription to a customer. Creates a new customer if one doesn't exist.",

    props: {
        customer_id: uscreenProps.customerId(),
        productType: uscreenProps.productType(),
        product_id: uscreenProps.productId(),
        perform_action_at: Property.ShortText({
            displayName: 'Schedule Access (Optional)',
            description: 'Schedule a time for the action to be performed (ISO 8601 format, e.g., 2024-07-05T13:47:52Z). Leave blank to assign immediately.',
            required: false,
        }),
        with_manual_billing: Property.Checkbox({
            displayName: 'Manual Billing (for Offers)',
            description: 'Only check this if the Product Type is "Offer" and this is a manual billing scenario.',
            required: false,
            defaultValue: false,
        }),
    },

    async run(context) {
        const { customer_id, product_id, productType, perform_action_at, with_manual_billing } = context.propsValue;
        const client = new UscreenClient(context.auth.secret_text);

        const body: Record<string, unknown> = {
            product_id: product_id,
            product_type: productType,
        };

        if (productType === 'offer' && with_manual_billing) {
            body['with_manual_billing'] = true;
        } else if (perform_action_at) {
            body['perform_action_at'] = perform_action_at;
        }
 
        return await client.makeRequest(
            HttpMethod.POST,
            `/customers/${customer_id}/accesses`,
            body
        );
    },
});