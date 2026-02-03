import { createAction, Property, httpClient, HttpMethod } from "@activepieces/pieces-framework";
import { canvaAuth } from "../../index";
import { Buffer } from "buffer";

export const uploadAsset = createAction({
    auth: canvaAuth,
    name: "upload_asset",
    displayName: "Upload Asset",
    description: "Upload an asset to Canva",
    props: {
        file: Property.File({
            displayName: "File",
            required: true,
        }),
        name: Property.ShortText({
            displayName: "Asset Name",
            required: true,
        }),
    },
    async run(context) {
        const { file, name } = context.propsValue;
        const nameBase64 = Buffer.from(name).toString("base64");

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://api.canva.com/rest/v1/asset-uploads",
            headers: {
                "Asset-Upload-Metadata": JSON.stringify({ name_base64: nameBase64 }),
                "Content-Type": "application/octet-stream",
            },
            body: file.data,
            authentication: {
                type: context.auth.type,
                token: context.auth.access_token,
            } as any,
        });

        return response.body;
    },
});
