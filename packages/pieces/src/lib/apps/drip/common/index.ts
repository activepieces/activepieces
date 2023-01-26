import { Property } from "../../../framework/property"

export const dripCommon = {
    baseUrl: (accountId: string) => { return `https://api.getdrip.com/v2/${accountId}` },
    authentication: Property.SecretText({
        displayName: "API Key",
        required: true,
        description: "Get it from https://www.getdrip.com/user/edit"
    }),
    account_id: Property.ShortText({
        displayName: 'Account ID',
        required: true,
        description: "Get it from https://www.getdrip.com/settings/general"
    })
}

