import { createAction, Property } from "@activepieces/pieces-framework";
import Client from 'ssh2-sftp-client'

export const createFile = createAction({
    name: 'create_file',
    displayName: 'Create new file',
    description: 'Create a new file in the given path',
    props: {
        // host, port, username, password
        authentication: Property.CustomAuth({
            displayName: 'Authentication',
            description: 'Enter the authentication details',
            props: {
                host: Property.ShortText({
                    displayName: 'Host',
                    description: 'The host of the SFTP server',
                    required: true,
                }),
                port: Property.Number({
                    displayName: 'Port',
                    description: 'The port of the SFTP server',
                    required: true,
                    defaultValue: 22,
                }),
                username: Property.ShortText({
                    displayName: 'Username',
                    description: 'The username of the SFTP server',
                    required: true,
                }),
                password: Property.SecretText({
                    displayName: 'Password',
                    description: 'The password of the SFTP server',
                    required: true,
                }),
            },
            required: true
        }),
        fileName: Property.ShortText({
            displayName: 'File Path',
            description: 'The name of the file to create',
            required: true,
        }),
        fileContent: Property.LongText({
            displayName: 'File content',
            description: 'The content of the file to create',
            required: true,
        }),
    },
    async run(context) {
        const host = context.propsValue['authentication'].host;
        const port = context.propsValue['authentication'].port;
        const username = context.propsValue['authentication'].username;
        const password = context.propsValue['authentication'].password;
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