import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { dripCommon } from "../common";

export const dripUpsertSubscriberAction = createAction({
    name: 'upsert_subscriber',
    description: 'Create or Update Subscriber',
    displayName: 'Create or Update Subscriber',
    props: {
        authentication: dripCommon.authentication,
        account_id: dripCommon.account_id,
        subscriber: dripCommon.subscriber,
        tags: dripCommon.tags,
        custom_fields: dripCommon.custom_fields,
        first_name: Property.ShortText({ displayName: "First Name", required: false }),
        last_name: Property.ShortText({ displayName: "Last Name", required: false }),
        zip: Property.ShortText({ displayName: 'Zip Code', description: "Postal code in which the subscriber resides", required: false }),
        country: Property.ShortText({ displayName: 'Country', description: "The country in which the subscriber resides", required: false }),
        state: Property.ShortText({ displayName: 'State', description: "The region in which the subscriber resides", required: false }),
        city: Property.ShortText({ displayName: 'City', description: "The city in which the subscriber resides", required: false }),
        phone: Property.ShortText({ displayName: 'Phone', description: "The subscriber's primary phone number", required: false }),
        address: Property.ShortText({ displayName: 'Address', description: "The subscriber's mailing address", required: false }),
    },
    sampleData: {},
    async run(context) {
        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${dripCommon.baseUrl(context.propsValue["account_id"]!)}/subscribers`,
            body: {
                subscribers: [{
                    email: context.propsValue["subscriber"],
                    tags: context.propsValue["tags"],
                    custom_fields: context.propsValue["custom_fields"],
                    country: context.propsValue["country"],
                    address1: context.propsValue["address"],
                    city: context.propsValue["city"],
                    state: context.propsValue["state"],
                    zip: context.propsValue["zip"],
                    phone: context.propsValue["phone"],
                    first_name: context.propsValue["first_name"],
                    last_name: context.propsValue["last_name"]
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