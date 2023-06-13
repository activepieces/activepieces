import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import Client from 'ssh2-sftp-client'

export const createFile = createAction({
	name: 'create_file', 
    displayName:'Create new file',
    description: 'Create a new file in the given path',
	props: {
		fileName: Property.ShortText({
			displayName: 'File name',
			description: 'The name of the file to create',
			required: true,
		}),
        fileContent: Property.LongText({
            displayName: 'File content',
            description: 'The content of the file to create',
            required: true,
        }),
        // host, port, username, password
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
	async run(context) {
        const host = context.propsValue['host']
        const port = context.propsValue['port']
        const username = context.propsValue['username']
        const password = context.propsValue['password']
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
            
            let fileObjects: Client.FileInfo[] | undefined = undefined;
            try {
                fileObjects = await sftp.list(".");
            } catch (err) {
                return {
                    status: 'error',
                    error: err
                }
            }

            const fileNames = [];
            if (fileObjects != undefined) {
                for (const file of fileObjects) {
                    fileNames.push(file.name);
                }
            }
            await sftp.end();

            return {
                status: 'success',
                result: {
                    fileNames
                }
            }
        } catch (err) {
            return {
                status: 'error',
                error: err
            }
        }
	},
});