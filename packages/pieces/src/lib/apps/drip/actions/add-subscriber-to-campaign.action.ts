import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { dripCommon } from "../common";

export const dripAddSubscriberToCampaign = createAction({
    name: 'add_subscriber_to_campaign',
    description: 'Add a subscriber to a campaign (Email series)',
    displayName: 'Add a subscriber to a campaign',
    props: {
        authentication: dripCommon.authentication,
        account_id: dripCommon.account_id,
        campaign_id: Property.Dropdown({
            displayName: "Campaign",
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
                    url: `${dripCommon.baseUrl(props['account_id'] as string)}/campaigns`,
                    headers: {
                        Authorization: `Basic ${Buffer.from(props["authentication"] as string).toString("base64")}`,
                    },
                };
                let response = await httpClient.sendRequest<{ campaigns: { name: string, id: string }[] }>(request);
                const opts = response.body.campaigns.map((campaign) => {
                    return { value: campaign.id, label: campaign.name };
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
        })
    },
    sampleData: {},
    async run(context) {
        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${dripCommon.baseUrl(context.propsValue["account_id"]!)}/campaigns/${context.propsValue["campaign_id"]}/subscribers`,
            body: {
                subscribers: [{
                    email: context.propsValue["subscriber"],
                    tags: context.propsValue["tags"],
                    custom_fields: context.propsValue["custom_fields"]
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