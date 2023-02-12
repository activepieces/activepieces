import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { Property } from "../../../framework/property"

export const dripCommon = {
    baseUrl: (accountId: string) => { return `https://api.getdrip.com/v2/${accountId}` },
    authentication: Property.SecretText({
        displayName: "API Key",
        required: true,
        description: "Get it from https://www.getdrip.com/user/edit"
    }),
    account_id: Property.Dropdown({
        displayName: 'Account',
        required: true,
        refreshers: ["authentication"],
        options: async (props) => {
            if (props['authentication'] === undefined) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please fill in API key first"
                }
            }

            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: "https://api.getdrip.com/v2/accounts",
                headers: {
                    Authorization: `Basic ${Buffer.from(props["authentication"] as string).toString("base64")}`,
                },
            };
            const response = await httpClient.sendRequest<{ accounts: { id: string, name: string }[] }>(request);
            const opts = response.body.accounts.map((acc) => {
                return { value: acc.id, label: acc.name };
            });
            return {
                disabled: false,
                options: opts,
            }
        }

    }),
    subscriber: Property.ShortText({ required: true, displayName: "Subscriber Email", description: "Email of the subscriber" }),
    tags: Property.Array({
        displayName: "tags",
        required: false,
        description: "Tags to apply to subscriber"
    }),
    custom_fields: Property.Object({
        displayName: "Custom Fields",
        required: false,
        description: "Custom field data about the subscriber"
    }),
    authorizationHeader: (apiKey: string) => `Basic ${Buffer.from(apiKey).toString('base64')}`

}

