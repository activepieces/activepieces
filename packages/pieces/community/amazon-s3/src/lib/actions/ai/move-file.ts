import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3MoveFileOutputSchema } from '../../output-schemas';

export const amazonS3MoveFileAi = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_move_file',
	outputSchema: amazonS3MoveFileOutputSchema,
	displayName: 'Move File',
	description: 'Moves or renames a file within the connected bucket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Moves or renames a file in the connected S3 bucket by copying it to the destination key and then deleting the source key; a file already at the destination is replaced. Not idempotent: after the first run the source key no longer exists, so a repeat fails. Files over 5 GB cannot be moved in one call.',
		idempotent: false,
	},
	props: {
		sourceKey: Property.ShortText({
			displayName: 'Source File Key',
			description: 'The full key of the file to move, as returned by List Files.',
			required: true,
		}),
		destinationKey: Property.ShortText({
			displayName: 'Destination File Key',
			description: 'The new full key, including the file name, e.g. "archive/2024/q1.csv".',
			required: true,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { sourceKey, destinationKey } = context.propsValue;

		if (sourceKey === destinationKey) {
			throw new Error('Source and destination keys are the same.');
		}

		const copied = await s3AiCommon.call({
			key: sourceKey,
			request: () =>
				s3.copyObject({
					Bucket: bucket,
					Key: destinationKey,
					CopySource: s3AiCommon.copySource({ bucket, key: sourceKey }),
				}),
		});
		await s3AiCommon.call({
			key: sourceKey,
			request: () => s3.deleteObject({ Bucket: bucket, Key: sourceKey }),
		});

		return {
			sourceKey,
			destinationKey,
			versionId: copied.VersionId ?? null,
			etag: copied.CopyObjectResult?.ETag ?? null,
			lastModified: s3AiCommon.toIso(copied.CopyObjectResult?.LastModified),
		};
	},
});
