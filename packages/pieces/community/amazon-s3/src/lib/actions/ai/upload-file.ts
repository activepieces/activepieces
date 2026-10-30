import { Upload } from '@aws-sdk/lib-storage';
import mime from 'mime-types';

import { streamUtils } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3UploadFileOutputSchema } from '../../output-schemas';

export const amazonS3UploadFileAi = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_upload_file',
	outputSchema: amazonS3UploadFileOutputSchema,
	displayName: 'Upload File',
	description: 'Uploads a file or text content to an exact key in the connected bucket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Writes a file or text content to an exact key in the connected S3 bucket, replacing any file already at that key unless "Do Not Overwrite" is set. Provide exactly one of File or Text Content. The content type is taken from the input, else guessed from the key\'s extension. Re-running with the same key and content leaves the same result.',
		idempotent: true,
	},
	props: {
		key: Property.ShortText({
			displayName: 'File Key',
			description:
				'The full key (path) to write, including the file name and extension, e.g. "reports/2024/q1.csv".',
			required: true,
		}),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload. Leave empty when using Text Content.',
			required: false,
			streaming: true,
		}),
		textContent: Property.LongText({
			displayName: 'Text Content',
			description:
				'Text to store as the file content, e.g. CSV or JSON. Leave empty when using File.',
			required: false,
		}),
		contentType: Property.ShortText({
			displayName: 'Content Type',
			description: 'MIME type, e.g. "text/csv". Leave empty to guess from the key\'s extension.',
			required: false,
		}),
		metadata: Property.Object({
			displayName: 'Custom Metadata',
			description: 'Key-value pairs stored with the file as user metadata (x-amz-meta-*).',
			required: false,
		}),
		doNotOverwrite: Property.Checkbox({
			displayName: 'Do Not Overwrite',
			description: 'Fail instead of replacing a file that already exists at this key.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { key, file, textContent, contentType, metadata, doNotOverwrite } = context.propsValue;

		const hasText = textContent !== undefined && textContent !== null && textContent !== '';
		if (file && hasText) {
			throw new Error('Provide either File or Text Content, not both.');
		}
		if (!file && !hasText) {
			throw new Error('Provide File or Text Content to upload.');
		}

		const resolvedContentType =
			contentType ||
			mime.lookup(key) ||
			(file?.extension ? mime.lookup(file.extension) : false) ||
			(hasText ? 'text/plain; charset=utf-8' : 'application/octet-stream');
		const body = file
			? streamUtils.toStreamingBody(file).body
			: Buffer.from(textContent ?? '', 'utf8');

		const response = await s3AiCommon.call({
			key,
			request: () =>
				new Upload({
					client: s3,
					params: {
						Bucket: bucket,
						Key: key,
						Body: body,
						ContentType: resolvedContentType,
						Metadata: metadata ? toStringRecord({ value: metadata }) : undefined,
						IfNoneMatch: doNotOverwrite ? '*' : undefined,
					},
				}).done(),
		});

		return {
			key,
			contentType: resolvedContentType,
			etag: response.ETag ?? null,
			versionId: response.VersionId ?? null,
		};
	},
});

function toStringRecord({ value }: { value: Record<string, unknown> }): Record<string, string> {
	return Object.fromEntries(
		Object.entries(value).map(([name, item]) => [
			name,
			typeof item === 'string' ? item : JSON.stringify(item),
		]),
	);
}
