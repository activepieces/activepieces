import { createAction, Property, HttpRequest, HttpMethod, httpClient } from "@activepieces/framework";
import { dripCommon } from "../common";

export const dripApplyTagToSubscriber = createAction({
    name: 'apply_tag_to_subscriber',
    description: 'Apply a tag to a subscriber',
    displayName: 'Apply a tag to subscriber',
    props: {
        authentication: dripCommon.authentication,
        account_id: dripCommon.account_id,
        subscriber: dripCommon.subscriber,
        tag: Property.ShortText({
            displayName: "Tag",
            required: true,
            description: "Tag to apply"
        })
    },
    sampleData: {},
    async run(context) {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${dripCommon.baseUrl(context.propsValue["account_id"]!)}/tags`,
            body: {
                tags: [{
                    email: context.propsValue["subscriber"],
                    tag: context.propsValue["tag"]
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
