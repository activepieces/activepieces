import { Property } from "../../../framework/property/prop.model";

export const hubspotCommons = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://app.hubspot.com/oauth/authorize",
        tokenUrl: "https://api.hubapi.com/oauth/v1/token",
        required: true,
        scope: ["crm.objects.contacts.write", "crm.objects.contacts.read"]
    })
}