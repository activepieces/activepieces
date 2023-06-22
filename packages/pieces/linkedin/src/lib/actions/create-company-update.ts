import { createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { Asset, linkedinCommon } from "../common";

export const createCompanyUpdate = createAction({
    name: "create_company_update",
    displayName: "Create Company Update",
    description: 'Create a company update on LinkedIn',
    sampleData: {},
    props: {
        authentication: linkedinCommon.authentication,
        company: linkedinCommon.company,
        text: linkedinCommon.text,
        link: linkedinCommon.link,
        linkTitle: linkedinCommon.linkTitle,
        linkDescription: linkedinCommon.linkDescription,
        imageUrl: linkedinCommon.imageUrl
    },

    run: async (context) => {
        const imageUrl = context.propsValue.imageUrl;
        const bodyConfig: {
            urn: string,
            text: string,
            link?: string | undefined,
            linkDescription?: string | undefined,
            linkTitle?: string | undefined,
            visibility: string,
            image?: Asset | undefined
        } = {
            urn: `organization:${context.propsValue.company}`,
            text: context.propsValue.text,
            link: context.propsValue.link,
            linkDescription: context.propsValue.linkDescription,
            linkTitle: context.propsValue.linkTitle,
            visibility: 'PUBLIC'
        }

        if (imageUrl) {
            bodyConfig.image = await linkedinCommon.uploadImage(context.propsValue.authentication.access_token, `organization:${context.propsValue.company}`, imageUrl);
        }

        const requestBody = linkedinCommon.generatePostRequestBody(bodyConfig);

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${linkedinCommon.baseUrl}/v2/ugcPosts`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue.authentication.access_token
            },
            body: requestBody,
        }

        try {
            const response = await httpClient.sendRequest(request);
            return response.body;
        }
        catch (error) {
            return error;
        }
    }
})