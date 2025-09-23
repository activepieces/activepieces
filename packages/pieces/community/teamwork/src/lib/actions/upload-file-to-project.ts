import { createAction, Property, File } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { resolveCredentials } from '../common/client';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const uploadFileToProject = createAction({
	name: 'upload_file_to_project',
	displayName: 'Upload File to Project',
	description: 'Upload a file to a Teamwork project',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		file: Property.File({ displayName: 'File', required: true }),
		description: Property.ShortText({ displayName: 'Description', required: false }),
	},
	async run({ auth, propsValue }) {
		const { apiKey, subdomain } = resolveCredentials(auth);
		const url = `https://${subdomain}.teamwork.com/projects/${propsValue.projectId}/files.json`;
		const form = new FormData();
		const f = propsValue.file as File;
		form.append('files[]', new Blob([f.data], { type: f.extension || 'application/octet-stream' }), f.fileName || 'upload');
		if (propsValue.description) form.append('description', String(propsValue.description));
		const res = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url,
			headers: {},
			body: form,
			authentication: { type: AuthenticationType.BASIC, username: apiKey, password: 'x' },
		});
		return { success: true, data: res.body };
	},
});


