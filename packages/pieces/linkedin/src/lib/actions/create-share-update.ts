import { createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { Asset, LinkedinJwtObject, linkedinCommon } from "../common";

import jwtDecode from "jwt-decode";

export const createShareUpdate = createAction({
    name: "create_share_update",
    displayName: "Create Share Update",
    description: 'Create a share update on LinkedIn',
    sampleData: {},
    props: {
        authentication: linkedinCommon.authentication,
        text: linkedinCommon.text,
        visibility: linkedinCommon.visibility,
        link: linkedinCommon.link,
        linkTitle: linkedinCommon.linkTitle,
        linkDescription: linkedinCommon.linkDescription,
        imageUrl: linkedinCommon.imageUrl
    },

    run: async (context) => {
        const token = context.propsValue.authentication.data.id_token;
        const decoded: LinkedinJwtObject = jwtDecode(token);
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
            urn: `person:${decoded.sub}`,
            text: context.propsValue.text,
            link: context.propsValue.link,
            linkDescription: context.propsValue.linkDescription,
            linkTitle: context.propsValue.linkTitle,
            visibility: context.propsValue.visibility
        }

        if (imageUrl) {
            bodyConfig.image = await linkedinCommon.uploadImage(context.propsValue.authentication.access_token, `person:${decoded.sub}`, imageUrl);
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