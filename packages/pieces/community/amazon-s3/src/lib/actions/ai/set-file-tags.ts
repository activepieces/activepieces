import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3GetFileTagsOutputSchema } from '../../output-schemas';

export const amazonS3SetFileTags = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_set_file_tags',
	outputSchema: amazonS3GetFileTagsOutputSchema,
	displayName: 'Set File Tags',
	description: 'Replaces all tags on a file with the given set.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the whole tag set on a file in the connected S3 bucket with the given key-value pairs (1–10 tags; keys up to 128 and values up to 256 characters). Tags not in the input are removed, so to add one, read the current tags with Get File Tags and send them all. Use Delete File Tags to clear every tag.',
		idempotent: true,
	},
	props: {
		key: Property.ShortText({
			displayName: 'File Key',
			description: 'The full key (path) of the file, as returned by List Files.',
			required: true,
		}),
		tags: Property.Object({
			displayName: 'Tags',
			description:
				'The complete tag set as key-value pairs, e.g. {"project": "alpha", "status": "final"}.',
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
		const { key, tags, versionId } = context.propsValue;

		const tagSet = Object.entries(tags).map(([name, value]) => ({
			Key: name,
			Value: typeof value === 'string' ? value : JSON.stringify(value),
		}));
		if (tagSet.length === 0) {
			throw new Error('Provide at least one tag, or use Delete File Tags to remove all tags.');
		}
		if (tagSet.length > MAX_TAGS) {
			throw new Error(`A file can have at most ${MAX_TAGS} tags; got ${tagSet.length}.`);
		}

		const response = await s3AiCommon.call({
			key,
			request: () =>
				s3.putObjectTagging({
					Bucket: bucket,
					Key: key,
					VersionId: versionId || undefined,
					Tagging: { TagSet: tagSet },
				}),
		});

		return {
			key,
			versionId: response.VersionId ?? null,
			tags: tagSet.map((tag) => ({ key: tag.Key, value: tag.Value })),
			count: tagSet.length,
		};
	},
});

const MAX_TAGS = 10;
