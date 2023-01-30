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
            displayName: "Email Series Campaign",
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
                const response = await httpClient.sendRequest<{ campaigns: { name: string, id: string }[] }>(request);
                const opts = response.body.campaigns.map((campaign) => {
                    return { value: campaign.id, label: campaign.name };
                });
                if (opts.length === 0) {
                    return {
                        disabled: false,
                        options: [],
                        placeholder: "Please create an email series campaign"
                    }
                }
                return {
                    disabled: false,
                    options: opts,
                }
            }
        }),
        subscriber: dripCommon.subscriber,
        tags: dripCommon.tags,
        custom_fields: dripCommon.custom_fields,
    },
    sampleData: {
        "links": {
            "subscribers.account": "https://api.getdrip.com/v2/accounts/{subscribers.account}"
        },
        "subscribers": [
            {
                "id": "1e0ukqg4yzqo1bxyy18f",
                "href": "https://api.getdrip.com/v2/AAAAAAA/subscribers/AAAAAAA",
                "status": "active",
                "email": "yrdd@ggg.com",
                "first_name": "joe",
                "last_name": "doe",
                "address1": "Iraq,Baghdad",
                "address2": "Amman,Jordan",
                "city": "Baghdad",
                "state": "Baghdad",
                "zip": "10011",
                "phone": "079123123123",
                "country": "Iraq",
                "time_zone": "Baghdad GMT+3",
                "utc_offset": 3,
                "visitor_uuid": null,
                "custom_fields": {},
                "tags": [],
                "created_at": "2023-01-30T07:42:12Z",
                "ip_address": "000.000.00",
                "user_agent": "Mozilla Firefox",
                "lifetime_value": null,
                "original_referrer": null,
                "landing_url": null,
                "prospect": false,
                "base_lead_score": null,
                "eu_consent": "unknown",
                "sms_number": "079123123123",
                "sms_consent": false,
                "lead_score": null,
                "user_id": null,
                "links": {
                    "account": "00000000"
                }
            }
        ]
    }
    ,
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
                'Authorization': dripCommon.authorizationHeader(context.propsValue["authentication"]!)
            },
            queryParams: {},
        };
        return await httpClient.sendRequest<Record<string, never>>(request);
    }
});