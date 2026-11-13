import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3CopyFileOutputSchema } from '../../output-schemas';

export const amazonS3CopyFile = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_copy_file',
	outputSchema: amazonS3CopyFileOutputSchema,
	displayName: 'Copy File',
	description: 'Copies a file to another key in the connected bucket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Copies a file to a new key in the connected S3 bucket, keeping its content type and metadata; a file already at the destination key is replaced. To restore an old version, pass its version id from List File Versions and the same key as destination. Files over 5 GB cannot be copied in one call and fail with the S3 error.',
		idempotent: true,
	},
	props: {
		sourceKey: Property.ShortText({
			displayName: 'Source File Key',
			description: 'The full key of the file to copy, as returned by List Files.',
			required: true,
		}),
		destinationKey: Property.ShortText({
			displayName: 'Destination File Key',
			description: 'The full key to copy to, including the file name, e.g. "archive/q1.csv".',
			required: true,
		}),
		sourceVersionId: Property.ShortText({
			displayName: 'Source Version ID',
			description:
				'A version id from List File Versions to copy an older version. Leave empty for the current version.',
			required: false,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { sourceKey, destinationKey, sourceVersionId } = context.propsValue;

		const response = await s3AiCommon.call({
			key: sourceKey,
			request: () =>
				s3.copyObject({
					Bucket: bucket,
					Key: destinationKey,
					CopySource: s3AiCommon.copySource({
						bucket,
						key: sourceKey,
						versionId: sourceVersionId || undefined,
					}),
				}),
		});

		return {
			sourceKey,
			destinationKey,
			sourceVersionId: response.CopySourceVersionId ?? null,
			versionId: response.VersionId ?? null,
			etag: response.CopyObjectResult?.ETag ?? null,
			lastModified: s3AiCommon.toIso(response.CopyObjectResult?.LastModified),
		};
	},
});
