import { createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { Image, linkedinCommon } from "../common";

export const createCompanyUpdate = createAction({
    name: "create_company_update",
    displayName: "Create Company Update",
    description: 'Create a new company update for Company Page',
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
            image?: Image | undefined
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
        const createPostHeaders: any = linkedinCommon.linkedinHeaders
        createPostHeaders["LinkedIn-Version"] = '202306';

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${linkedinCommon.baseUrl}/rest/posts`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue.authentication.access_token
            },
            headers: createPostHeaders,
            body: requestBody,
        }

        const response = await httpClient.sendRequest(request);
        return response.body;
    }
})