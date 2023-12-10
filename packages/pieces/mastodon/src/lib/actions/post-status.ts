import { Property, createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { mastodonAuth } from "../..";

const uploadMedia = async (mediaUrl: string, baseUrl: string, token: string) => {
    const getMediaResponse = await httpClient.sendRequest({
        url: mediaUrl,
        method: HttpMethod.GET,
        responseType: 'stream',
    })

    const postMediaResponse = await httpClient.sendRequest({
        url: `${baseUrl}/api/v2/media`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token,
        },
        headers: {
            'Content-type': 'multipart/form-data',
        },
        body: {
            file: getMediaResponse.body,
        },
    })

    return postMediaResponse.body.id
}

export const postStatus = createAction({
    auth: mastodonAuth,
        name: 'post_status',
        displayName: 'Post Status',
        description: 'Post a status to Mastodon',
        props: {
            status: Property.LongText({
                displayName: 'Status',
                description: 'The text of your status',
                required: true,
            }),
            media: Property.LongText({
                displayName: 'Media URL',
                description: 'The media attachement for your status',
                required: false,
            })
        },
        async run(context) {
            const token = context.auth.access_token;
            const status = context.propsValue.status;
            const mediaUrl = context.propsValue.media;
            // Remove trailing slash from base_url
            const baseUrl = context.auth.base_url.replace(/\/$/, "");

            let mediaId: string | undefined = undefined
            if (mediaUrl) {
                mediaId = await uploadMedia(mediaUrl, baseUrl, token)
            }

            return await httpClient.sendRequest({
                url: `${baseUrl}/api/v1/statuses`,
                method: HttpMethod.POST,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token,
                },
                body: {
                    status,
                    ...(mediaId ? { media_ids: [mediaId] } : {})
                }
            })
        },
});
