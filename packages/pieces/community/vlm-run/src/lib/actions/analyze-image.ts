import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { vlmRunAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const analyzeImageAction = createAction({
    auth: vlmRunAuth,
    name: 'analyze_image',
    displayName: 'Analyze Image',
    description: 'Process an image (file or URL), extracting descriptions, detecting objects, etc.',
    props: {
        images: Property.Array({
            displayName: 'Image URLs or Base64',
            description: 'A list of public URLs or base64 encoded strings for the images to analyze.',
            required: true,
        }),
        domain: Property.StaticDropdown({
            displayName: 'Domain',
            description: 'The analysis to perform on the image.',
            required: true,
            options: {
                options: [
                    { label: 'Image Caption', value: 'image.caption' },
                    { label: 'Object Detection (Experimental)', value: 'experimental.image.object-detection' },
                    { label: 'Person Detection (Experimental)', value: 'experimental.image.person-detection' },
                    { label: 'TV News Caption', value: 'image.tv-news' },
                    { label: 'Video Caption', value: 'video.caption' },
                    { label: 'Document - Invoice', value: 'document.invoice' },
                    { label: 'Document - Markdown', value: 'document.markdown' },
                    { label: 'Document - Receipt', value: 'document.receipt' },
                    { label: 'Document - Resume', value: 'document.resume' },
                    { label: 'Aerospace - Remote Sensing', value: 'aerospace.remote-sensing' },
                    { label: 'Retail - Product Catalog', value: 'retail.product-catalog' },
                ],
            },
        }),
        batch: Property.Checkbox({
            displayName: 'Batch Mode (Async)',
            description: 'If true, the job runs asynchronously in the background.',
            required: false,
            defaultValue: false,
        }),
        callback_url: Property.ShortText({
            displayName: 'Callback URL',
            description: 'An optional URL to send a POST request to when the async job is complete.',
            required: false,
        }),
        metadata: Property.Json({
            displayName: 'Metadata',
            description: 'Optional JSON metadata to pass to the model.',
            required: false,
        }),
        config: Property.Json({
            displayName: 'Config',
            description: 'Optional JSON config for VLM generation.',
            required: false,
        }),
    },
    async run(context) {
        const { images, domain, batch, callback_url, metadata, config } = context.propsValue;

        const requestBody = {
            images,
            domain,
            batch,
            callback_url: callback_url || undefined,
            metadata: metadata || undefined,
            config: config || undefined,
        };


        return await makeRequest(
            context.auth,
            HttpMethod.POST,
            '/image/generate',
            requestBody
        );
    },
});