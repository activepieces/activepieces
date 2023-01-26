import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { dripCommon } from "../common";

export const dripApplyTagToSubscriber = createAction({
    name: 'apply_tag_to_subscriber',
    description: 'Apply a tag to a subscriber',
    displayName: 'Apply a tag to subscriber',
    props: {
        authentication: dripCommon.authentication,
        account_id: dripCommon.account_id,
        subscriber: dripCommon.subscribers,
        tag: Property.Dropdown({
            displayName: "Tag",
            refreshers: ["authentication", "account_id"],
            required: true,
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
                    url: `${dripCommon.baseUrl(props['account_id'] as string)}/tags`,
                    headers: {
                        Authorization: `Basic ${Buffer.from(props["authentication"] as string).toString("base64")}`,
                    },
                };
                let response = await httpClient.sendRequest<{ tags: string[] }>(request);
                const opts = response.body.tags.map((tag) => {
                    return { value: tag, label: tag };
                });
                return {
                    disabled: false,
                    options: opts,
                }
            }
        })
    },
    sampleData: {},
    async run(context) {
        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${dripCommon.baseUrl(context.propsValue["account_id"]!)}/tags`,
            body: {
                tags: [{
                    email: context.propsValue["subscriber"],
                    tag: context.propsValue["tag"]
                }]

            },
            headers: {
                'Authorization': `Basic ${Buffer.from(context.propsValue["authentication"]!).toString('base64')}`
            },
            queryParams: {},
        };
        return await httpClient.sendRequest<{}>(request);
    }
});