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

        const uploadResponse = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://api.canva.com/rest/v1/asset-uploads",
            authentication: {
                type: "bearer",
                token: context.auth.access_token,
            },
            body: Buffer.from(file.base64, "base64"),
            headers: {
                "Content-Type": "application/octet-stream",
                "Asset-Upload-Metadata": JSON.stringify({
                    name_base64: Buffer.from(name).toString("base64"),
                }),
            },
        });

        let job = uploadResponse.body?.job;
        if (!job) {
            throw new Error(
                `Canva asset upload returned an unexpected response: ${JSON.stringify(
                    uploadResponse.body
                )}`
            );
        }
        const maxRetries = 10;
        let retries = 0;

        while (job.status === "in_progress" && retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const pollResponse = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.canva.com/rest/v1/asset-uploads/${job.id}`,
                authentication: {
                    type: "bearer",
                    token: context.auth.access_token,
                },
            });
            job = pollResponse.body.job;
            retries++;
        }

        if (job.status === "failed") {
            throw new Error(
                `Canva asset upload failed: ${job.error?.message || "Unknown error"}`
            );
        }

        if (job.status === "in_progress") {
            throw new Error("Canva asset upload timed out");
        }

        return job.asset;
    },
});
