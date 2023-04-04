import { Property } from "@activepieces/framework";

export const shopifyCommon = {
    authentication: Property.OAuth2({
        props: {
            shop: Property.ShortText({
                displayName: 'Shop Name',
                description: 'Shop Name',
                required: true
            })
        },
        displayName: 'Authentication',
        description: 'Authentication for the webhook',
        required: true,
        authUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
        tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token",
        scope: ['read_orders', 'read_customers']
    })
}