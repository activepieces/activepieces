import {
	createAction,
	Property,
	DynamicPropsValue,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const uploadFileToProject = createAction({
	name: 'upload_file_to_project',
	displayName: 'Upload File to Project',
	description: 'Upload a file to a Teamwork project.',
	auth: teamworkAuth,
	props: {
		projectId: Property.Dropdown({
			displayName: 'Project',
			description: 'The project to upload the file to.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects/api/v3/projects.json',
				});
				const options = res.data.projects.map((p: { id: string; name: string }) => ({
					label: p.name,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'A description for the file.',
			required: false,
		}),
		categoryId: Property.Dropdown({
			displayName: 'Category',
			description: 'The category to assign the file to.',
			required: false,
			refreshers: ['projectId'],
			options: async ({ auth, projectId }) => {
				if (!auth || !projectId) {
					return {
						disabled: true,
						placeholder: 'Please select a project.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: `/projects/api/v3/projects/${projectId}/filecategories.json`,
				});
				const options = res.data.filecategories.map((c: { id: string; name: string }) => ({
					label: c.name,
					value: c.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		private: Property.Checkbox({
			displayName: 'Private',
			description: 'Set to true to make the file private.',
			required: false,
		}),
	},

	async run({ auth, propsValue }) {
		// Step 1: Get presigned URL
		const presignedUrlRes = await teamworkRequest(auth, {
			method: HttpMethod.GET,
			path: '/projects/api/v1/pendingfiles/presignedurl.json',
			query: {
				fileName: propsValue.file.filename,
				fileSize: propsValue.file.data.length,
			},
		});
		const { ref, url } = presignedUrlRes.data;

		// Step 2: Upload file to S3
		await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: url,
			body: propsValue.file.data,
			headers: {
				'X-Amz-Acl': 'public-read',
				'Content-Length': String(propsValue.file.data.length),
			},
		});

		// Step 3: Finalize file upload
		const body = {
			file: {
				pendingFileRef: ref,
				description: propsValue.description,
				'category-id': propsValue.categoryId,
				private: propsValue.private ? 1 : 0,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/${propsValue.projectId}/files.json`,
			body,
		});
	},
});


