import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    httpClient,
    HttpHeader
} from '@activepieces/pieces-common';
import { docsbotAuth } from '../../index';
import { docsbotCommon } from '../common/common';

export const uploadSourceFile = createAction({
    auth: docsbotAuth,
    name: 'upload_source_file',
    description: 'Upload a file to be used as a source.',
    displayName: 'Upload Source File',
    props: {
        teamId: docsbotCommon.teamId,
        botId: docsbotCommon.botId,
        file_content: Property.File({
            displayName: 'File Content',
            required: true,
        }),
        file_name: Property.ShortText({
            displayName: 'File Name',
            description: 'The name of the file with its extension (e.g., my_document.pdf).',
            required: true,
        }),
    },

    async run(context) {
        const { teamId, botId, file_content, file_name } = context.propsValue;

        // 1. Get presigned upload URL from DocsBot
        const uploadUrlRequest: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://docsbot.ai/api/teams/${teamId}/bots/${botId}/upload-url`,
            queryParams: { fileName: file_name },
            headers: { 'Authorization': `Bearer ${context.auth}` },
        };
        const uploadUrlResponse = await httpClient.sendRequest<{ url: string, file: string }>(uploadUrlRequest);
        const presignedUrl = uploadUrlResponse.body.url;
        
        // 2. Upload the actual file to the presigned URL
        const uploadRequest: HttpRequest<Buffer> = {
            method: HttpMethod.PUT,
            url: presignedUrl,
            // FIX: Use the file_content.data directly as it's already a Buffer
            body: file_content.data,
            headers: {
                [HttpHeader.CONTENT_TYPE]: 'application/octet-stream',
            },
        };
        await httpClient.sendRequest(uploadRequest);

        // Return the response from the first call, which contains the URL and the file path for use in other steps.
        return uploadUrlResponse.body;
    },
});

