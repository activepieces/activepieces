import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3GetFileTagsOutputSchema } from '../../output-schemas';

export const amazonS3GetFileTags = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_get_file_tags',
	outputSchema: amazonS3GetFileTagsOutputSchema,
	displayName: 'Get File Tags',
	description: 'Gets the tags on a file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the key-value tags on a file in the connected S3 bucket (at most 10 per file); a file with no tags returns an empty list. Read these before Set File Tags when adding a tag, since setting replaces the whole set.',
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
				s3.getObjectTagging({ Bucket: bucket, Key: key, VersionId: versionId || undefined }),
		});
		const tags = (response.TagSet ?? []).map((tag) => ({
			key: tag.Key ?? null,
			value: tag.Value ?? null,
		}));

		return { key, versionId: response.VersionId ?? null, tags, count: tags.length };
	},
});
