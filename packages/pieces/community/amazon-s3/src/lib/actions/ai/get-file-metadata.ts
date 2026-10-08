import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3GetFileMetadataOutputSchema } from '../../output-schemas';

export const amazonS3GetFileMetadata = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_get_file_metadata',
	outputSchema: amazonS3GetFileMetadataOutputSchema,
	displayName: 'Get File Metadata',
	description:
		"Gets a file's size, content type, last modified date and custom metadata without downloading it.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets a file's size, content type, last modified date, ETag, storage class and custom metadata without downloading its content. Use it to check that a key exists or inspect a file before reading it; use Read File for the content. Pass a version id from List File Versions to inspect an older version.",
		idempotent: true,
	},
	props: {
		key: Property.ShortText({
			displayName: 'File Key',
			description:
				'The full key (path) of the file, e.g. "reports/2024/q1.csv", as returned by List Files.',
			required: true,
		}),
		versionId: Property.ShortText({
			displayName: 'Version ID',
			description: 'A version id from List File Versions. Leave empty for the current version.',
			required: false,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { key, versionId } = context.propsValue;

		const response = await s3AiCommon.call({
			key,
			request: () => s3.headObject({ Bucket: bucket, Key: key, VersionId: versionId || undefined }),
		});

		return {
			key,
			versionId: response.VersionId ?? null,
			size: response.ContentLength ?? null,
			contentType: response.ContentType ?? null,
			lastModified: s3AiCommon.toIso(response.LastModified),
			etag: response.ETag ?? null,
			storageClass: response.StorageClass ?? 'STANDARD',
			contentEncoding: response.ContentEncoding ?? null,
			contentDisposition: response.ContentDisposition ?? null,
			cacheControl: response.CacheControl ?? null,
			serverSideEncryption: response.ServerSideEncryption ?? null,
			metadata: response.Metadata ?? {},
		};
	},
});
