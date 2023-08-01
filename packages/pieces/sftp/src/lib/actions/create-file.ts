import { createAction, Property } from "@activepieces/pieces-framework";
import Client from 'ssh2-sftp-client'
import { sftpAuth } from "../..";

export const createFile = createAction({
    auth: sftpAuth,
    name: 'create_file',
    displayName: 'Create new file',
    description: 'Create a new file in the given path',
    props: {
        fileName: Property.ShortText({
            displayName: 'File Path',
            description: 'The name of the file to create',
            required: true,
        }),
        fileContent: Property.LongText({
            displayName: 'File content',
            description: 'The content of the file to create',
            required: true,
        })
    },
    async run(context) {
        const host = context.auth.host;
        const port = context.auth.port;
        const username = context.auth.username;
        const password = context.auth.password;
        const fileName = context.propsValue['fileName']
        const fileContent = context.propsValue['fileContent']
        const sftp = new Client();

        try {
            await sftp.connect({
                host,
                port,
                username,
                password
            });

            await sftp.put(Buffer.from(fileContent), fileName);
            await sftp.end();

            return {
                status: 'success'
            }
        } catch (err) {
            return {
                status: 'error',
                error: err
            }
        }
    },
});
