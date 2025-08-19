import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import FormData from 'form-data';
import { parseMistralError } from '../common/props';

const SUPPORTED_PURPOSES = ['fine-tune', 'batch', 'ocr'];
const MAX_FILE_SIZE_BYTES = 512 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
	'jsonl',
	'txt',
	'csv',
	'pdf',
	'docx',
	'png',
	'jpg',
	'jpeg',
	'mp3',
	'mp4',
];

function getFileExtension(filename: string): string {
	const parts = filename.split('.');
	return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export const uploadFile = createAction({
	auth: mistralAuth,
	name: 'upload_file',
	displayName: 'Upload File',
	description: 'Upload a file to Mistral AI (e.g., for fine-tuning or context storage).',
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload (max 512MB).For fine tuning purspose provide .jsonl file.',
			required: true,
		}),
		purpose: Property.StaticDropdown({
			displayName: 'Purpose',
			description: 'Purpose of the file.',
			required: true,
			options: {
				options: SUPPORTED_PURPOSES.map((p) => ({ label: p, value: p })),
			},
		}),
	},
	async run(context) {
		const { file, purpose } = context.propsValue;

		if (!file) throw new Error('File is required');

		if (!SUPPORTED_PURPOSES.includes(purpose)) throw new Error('Invalid purpose');

		if (file.data.byteLength > MAX_FILE_SIZE_BYTES) throw new Error('File exceeds 512MB limit');

		const ext = getFileExtension(file.filename);

		if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error(`File extension .${ext} is not allowed`);

		const form = new FormData();
		form.append('file', Buffer.from(file.data), file.filename);
		form.append('purpose', purpose);

		try {
			const response = await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: 'https://api.mistral.ai/v1/files',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth as string,
				},
				headers:{
					...form.getHeaders()
				},
				body: form,
			});
			return response.body;
		} catch (e: any) {
			throw new Error(parseMistralError(e));
		}
	},
});
