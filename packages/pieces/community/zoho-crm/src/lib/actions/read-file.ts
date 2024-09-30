import { zohoCrmAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";


export const readFile = createAction({
    auth: zohoCrmAuth,
    name: 'read-file',
    displayName: 'Read file',
    description: 'Download a file content from Zoho CRM. e.g.: a Backup File',
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The full URL to use, including the base URL',
            required: true,
            defaultValue: '',
        })
    },
    run: async ({ auth, propsValue, files }) => {
        const url = propsValue['url'];

        const download = await fetch(url, {
            headers: {
                Authorization: `Bearer ${auth.access_token}`,
            },
        })
            .then((response) =>
                response.ok ? response.blob() : Promise.reject(response)
            )
            .catch((error) =>
                Promise.reject(
                    new Error(
                        `Error when download file:\n\tDownload file response: ${(error as Error).message ?? error
                        }`
                    )
                )
            );

        const fileName = url.split('/').pop() ?? url;

        return files.write({
            fileName: fileName,
            data: Buffer.from(await download.arrayBuffer()),
        });
    },
});
