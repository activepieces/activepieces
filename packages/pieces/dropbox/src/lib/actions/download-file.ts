import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { dropboxAuth } from "../../";

export const dropboxDownloadFile = createAction({
    auth: dropboxAuth,
    name: 'download_dropbox_file',
    description: 'Download a file from your Dropbox',
    displayName: 'Download file',
    props: {
        path: Property.ShortText({
            displayName: 'Path',
            description: 'The path in Dropbox of the file you want to download (e.g. /folder1/file.txt)',
            required: true,
        }),
    },
    async run(context) {
        const params = {
            path: context.propsValue.path
        };

        const result = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.dropboxapi.com/2/files/get_temporary_link`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { path: context.propsValue.path },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,

            },

        });

        return result.body;
    }
});