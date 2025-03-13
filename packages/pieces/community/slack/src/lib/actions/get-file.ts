import { slackAuth } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';

export const getFileAction = createAction({
	auth: slackAuth,
	name: 'get-file',
	displayName: 'Get File',
	description: 'Return information about a given file ID.',
	props: {
		fileId: Property.ShortText({
			displayName: 'File ID',
			required: true,
			description: 'You can pass the file ID from the New Message Trigger payload.',
		}),
	},
	async run(context) {
		const client = new WebClient(context.auth.access_token);

		const fileData = await client.files.info({ file: context.propsValue.fileId });

		const fileDownloadUrl = fileData.file?.url_private_download;

		if (!fileDownloadUrl) {
			throw new Error('Unable to find the download URL.');
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: fileDownloadUrl,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			responseType: 'arraybuffer',
		});

		return {
			...fileData.file,
			data: await context.files.write({
				fileName: fileData.file?.name || `file`,
				data: Buffer.from(response.body),
			}),
		};
	},
});
