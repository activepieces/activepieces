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

            const request: HttpRequest<never> = {
                method: HttpMethod.GET,
                url: "https://api.getdrip.com/v2/accounts",
                headers: {
                    Authorization: `Basic ${Buffer.from(props["authentication"] as string).toString("base64")}`,
                },
            };
            let response = await httpClient.sendRequest<{ accounts: { id: string, name: string }[] }>(request);
            const opts = response.body.accounts.map((acc) => {
                return { value: acc.id, label: acc.name };
            });
            return {
                disabled: false,
                options: opts,
            }
        }

    }),
    subscribers: Property.Dropdown({
        displayName: 'Person',
        required: true,
        refreshers: ["authentication", "account_id"],
        options: async (props) => {
            if (props['authentication'] === undefined) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please fill in API key first"
                }
            }
            if (props['account_id'] === undefined) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please select an account first"
                }
            }
            const request: HttpRequest<never> = {
                method: HttpMethod.GET,
                url: dripCommon.baseUrl(props['account_id'] as string) + '/subscribers',
                headers: {
                    Authorization: `Basic ${Buffer.from(props["authentication"] as string).toString("base64")}`,
                },

            };
            let response = await httpClient.sendRequest<{ subscribers: { id: string, email: string }[] }>(request);
            const opts = response.body.subscribers.map((sub) => {
                return { value: sub.email, label: sub.email };
            });
            return {
                disabled: false,
                options: opts,
            }
        }
    }),

}

