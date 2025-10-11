import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { serviceNowAuth, ServiceNowAuth } from "../common/auth";
import { serviceNowProps } from "../common/props";
import mime from "mime-types";

export const attachFileAction = createAction({
    auth: serviceNowAuth,
    name: 'attach_file',
    displayName: 'Attach File to Record',
    description: 'Upload a file from a URL and attach it to a specific record.',
    props: {
        table_name: serviceNowProps.table_name(),
        record_id: serviceNowProps.record_id(),
        file_url: Property.ShortText({
            displayName: 'File URL',
            description: 'The public URL of the file to download and attach.',
            required: true,
        }),
        file_name: Property.ShortText({
            displayName: 'File Name (Optional)',
            description: 'An optional name to override the original filename, including its extension (e.g., "report.pdf").',
            required: false,
        }),
    },
    async run(context) {
        const { table_name, record_id, file_url, file_name } = context.propsValue;

        const response = await httpClient.sendRequest<Buffer>({
            method: HttpMethod.GET,
            url: file_url as string,
            responseType: 'arraybuffer'
        });

        const fileData = response.body;
        const originalFilename = new URL(file_url as string).pathname.split('/').pop() || 'file.bin';

        const finalFilename = file_name || originalFilename;
        const { instance_url, api_key } = context.auth as ServiceNowAuth;

        const url = new URL(`${instance_url}/api/now/attachment/file`);
        url.searchParams.append('table_name', table_name as string);
        url.searchParams.append('table_sys_id', record_id as string);
        url.searchParams.append('file_name', finalFilename);

        const contentType = mime.lookup(finalFilename) || 'application/octet-stream';

        const request: HttpRequest<Buffer> = {
            method: HttpMethod.POST,
            url: url.toString(),
            body: fileData,
            headers: {
                'Content-Type': contentType,
                'x-sn-apikey': api_key,
                'Accept': 'application/json',
            },
        };

        const uploadResponse = await httpClient.sendRequest(request);
        return uploadResponse.body;
    },
});