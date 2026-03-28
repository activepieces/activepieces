import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaAuth } from "../auth";

export const uploadAssetAction = createAction({
    auth: canvaAuth,
    name: "upload_asset",
    displayName: "Upload Asset",
    description: "Uploads an asset to Canva's media library",
    props: {
        name: Property.ShortText({
            displayName: "Asset Name",
            required: true,
        }),
        file: Property.File({
            displayName: "File",
            required: true,
        }),
    },
    async run(context) {
        const { name, file } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://api.canva.com/rest/v1/assets",
            authentication: {
                type: "bearer",
                token: context.auth.access_token,
            },
            body: {
                name,
                file: file.base64,
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.body;
    },
});
