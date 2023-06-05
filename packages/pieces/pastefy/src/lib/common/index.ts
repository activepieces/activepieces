import { Property, StaticPropsValue } from "@activepieces/pieces-framework";
import { PastefyClient } from "./client";

export const pastefyCommon = {
    authentication: (required = true) => Property.CustomAuth({
        displayName: 'Authentication',
        description: 'API credentials to authorize against the pastefy api',
        required,
        props: {
            instance_url: Property.ShortText({
                displayName: 'Pastefy Instance URL',
                required: false,
                defaultValue: 'https://pastefy.app'
            }),
            token: Property.SecretText({
                displayName: 'API-Token',
                required: true
            })   
        }
    })
}

export function makeClient(propsValue: StaticPropsValue<any>): PastefyClient {
    return new PastefyClient(propsValue.token, propsValue.instance_url)
}