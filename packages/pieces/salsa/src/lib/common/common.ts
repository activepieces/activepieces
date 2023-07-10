import { Property } from "@activepieces/pieces-framework";

export enum IdentifierType {
    SUPPORTER_ID = 'SUPPORTER_ID',
    EMAIL_ADDRESS = 'EMAIL_ADDRESS',
    EXTERNAL_ID = 'EXTERNAL_ID',
    CLASSIC_KEY = 'CLASSIC_KEY',
    SALESFORCE_ID = 'SALESFORCE_ID',
    SEARCH_STRING = 'SEARCH_STRING',
}

export const salsaCommon = {
    baseUrl: Property.ShortText({
        displayName: "API Url",
        required: true,
        description: "API url acquired from your Salsa API",
        defaultValue: "https://api.salsalbs.org/api"
    }),
    identifierType: Property.Dropdown<string>({
        displayName: "Identifier Type",
        required: false,
        description: "Select the object",
        refreshers: [],
        options: async () => {
            return {
                options: [
                    {
                        label: "Supporter Id",
                        value: IdentifierType.SUPPORTER_ID,
                    },
                    {
                        label: "Email Address",
                        value: IdentifierType.EMAIL_ADDRESS,
                    },
                    {
                        label: "External Id",
                        value: IdentifierType.EXTERNAL_ID,
                    },
                    {
                        label: "Classic Key",
                        value: IdentifierType.CLASSIC_KEY,
                    },
                    {
                        label: "Salesforce Id",
                        value: IdentifierType.SALESFORCE_ID,
                    },
                    {
                        label: "Search String",
                        value: IdentifierType.SEARCH_STRING,
                    }
                ]
            }
        },
        defaultValue: IdentifierType.SEARCH_STRING
    }),
}
