import { Property } from "@activepieces/framework";

export const constantContactProps = {
    authentication: Property.OAuth2({
        displayName: "Authentication",
        required: true,
        tokenUrl: "https://authz.constantcontact.com/oauth2/default/v1/token",
        authUrl: "https://authz.constantcontact.com/oauth2/default/v1/authorize",
        scope: ["contact_data"]
    })
}