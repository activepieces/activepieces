import { Property } from "@activepieces/pieces-framework";

export const bloomerangCommon = {
    baseUrl: "https://api.bloomerang.co/v2",
    transaction_stuff: Property.StaticDropdown<string>({
        displayName: "Transaction stuff",
        required: true,
        description: "Select the object",
        options:  {
            options: [
                {
                    label: "Campaign",
                    value: "campaigns",
                },
                {
                    label: "Appeal",
                    value: "appeals",
                },
                {
                    label: "Fund",
                    value: "funds",
                }
            ]
        }
    }),
    contact_type: Property.StaticDropdown<string>({
        displayName: "Contact type",
        required: false,
        description: "Select the object",
        options:{
            options: [
                {
                    label: "Individual",
                    value: "Individual",
                },
                {
                    label: "Organization",
                    value: "Organization",
                },
                {
                    label: "Household",
                    value: "Household",
                }
            ]
        }
    }),
}
