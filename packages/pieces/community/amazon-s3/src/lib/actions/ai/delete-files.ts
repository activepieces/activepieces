import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3DeleteFilesOutputSchema } from '../../output-schemas';

export const amazonS3DeleteFiles = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_delete_files',
	outputSchema: amazonS3DeleteFilesOutputSchema,
	displayName: 'Delete Files',
	description: 'Deletes up to 1000 files from the connected bucket in one call.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes up to 1000 files by key from the connected S3 bucket in one call and reports which keys were deleted and which failed. On a versioned bucket this adds a delete marker and older versions stay restorable. Keys that do not exist count as deleted, so repeating the call is safe.',
		idempotent: true,
	},
	props: {
		keys: Property.Array({
			displayName: 'File Keys',
			description: 'The full keys of the files to delete (1–1000), as returned by List Files.',
			required: true,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const keys = context.propsValue.keys.filter(
			(key): key is string => typeof key === 'string' && key !== '',
		);
		const invalid = context.propsValue.keys.length - keys.length;

		if (invalid > 0) {
			throw new Error(
				`File Keys must be non-empty strings; ${invalid} entr${
					invalid === 1 ? 'y is' : 'ies are'
				} not. Nothing was deleted.`,
			);
		}
		if (keys.length === 0) {
			throw new Error('Provide at least one file key to delete.');
		}
		if (keys.length > MAX_KEYS) {
			throw new Error(`At most ${MAX_KEYS} keys can be deleted in one call; got ${keys.length}.`);
		}

		const response = await s3AiCommon.call({
			request: () =>
				s3.deleteObjects({
					Bucket: bucket,
					Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: false },
				}),
		});

		const deleted = (response.Deleted ?? []).map((item) => ({
			key: item.Key ?? null,
			versionId: item.VersionId ?? null,
			deleteMarker: item.DeleteMarker ?? false,
		}));
		const failed = (response.Errors ?? []).map((item) => ({
			key: item.Key ?? null,
			code: item.Code ?? null,
			message: item.Message ?? null,
		}));

		return {
			success: failed.length === 0,
			deletedCount: deleted.length,
			failedCount: failed.length,
			deleted,
			failed,
		};
	},
});

const MAX_KEYS = 1000;
