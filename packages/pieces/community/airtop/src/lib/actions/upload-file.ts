import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, fileProperty } from '../common/props';
import mime from 'mime-types';
import axios from 'axios';

export const airtopUploadFileAction = createAction({
    auth: airtopAuth,
    name: 'airtop_upload_file',
    displayName: 'Upload File to Session',
    description: 'Uploads a file to Airtop and makes it available to one or more sessions.',
    props: {
        file: fileProperty,
        fileName: Property.ShortText({
            displayName: 'File Name',
            required: false,
            description: 'Optional: Rename the file on upload (default: file name from upload).',
        }),
        sessionIds: Property.Array({
            displayName: 'Session IDs',
            description: 'List of session IDs to make the file available to (optional).',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const { file, fileName, sessionIds } = propsValue;

        const fileData = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/files`,
            body: {
                fileName: fileName || file.filename,
                sessionIds: sessionIds && sessionIds.length > 0 ? sessionIds : undefined,
            },
        });

        const uploadUrl = fileData?.data?.uploadUrl;
        const fileId = fileData?.data?.id;

        if (!uploadUrl || !fileId) {
            throw new Error('Failed to get presigned upload URL or file ID from Airtop');
        }

        const mimeType =
            (file as any).mimeType ||
            mime.lookup(file.extension || file.filename) ||
            'application/octet-stream';

        await axios.put(uploadUrl, Buffer.from(file.base64, 'base64'), {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': Buffer.byteLength(Buffer.from(file.base64, 'base64')),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        if (sessionIds && sessionIds.length > 0) {
            await airtopApiCall<any>({
                apiKey: auth as string,
                method: HttpMethod.POST,
                resourceUri: `/files/${fileId}/push`,
                body: { sessionIds },
            });
        }

        return {
            fileId,
            fileName: fileName || file.filename,
            mimeType,
            uploaded: true,
            availableInSessions: sessionIds ?? [],
        };
    },
});
