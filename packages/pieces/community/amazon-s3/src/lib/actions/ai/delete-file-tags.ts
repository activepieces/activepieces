import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3DeleteFileTagsOutputSchema } from '../../output-schemas';

export const amazonS3DeleteFileTags = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_delete_file_tags',
	outputSchema: amazonS3DeleteFileTagsOutputSchema,
	displayName: 'Delete File Tags',
	description: 'Removes all tags from a file.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes every tag from a file in the connected S3 bucket; the file itself is not changed. To remove only some tags, use Set File Tags with the tags to keep. Running it on a file with no tags succeeds.',
		idempotent: true,
	},
	props: {
		key: Property.ShortText({
			displayName: 'File Key',
			description: 'The full key (path) of the file, as returned by List Files.',
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
			request: () =>
				s3.deleteObjectTagging({ Bucket: bucket, Key: key, VersionId: versionId || undefined }),
		});

		return { key, versionId: response.VersionId ?? null, deleted: true };
	},
});
