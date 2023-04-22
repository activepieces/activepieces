import { Property } from "@activepieces/pieces-framework";

export const googleContactsCommon = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/contacts"]
    }),
    baseUrl: `https://people.googleapis.com/v1/people`
}
