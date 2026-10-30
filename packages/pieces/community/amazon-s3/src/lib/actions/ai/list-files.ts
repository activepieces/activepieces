import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3ListFilesOutputSchema } from '../../output-schemas';

export const amazonS3ListFilesAi = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_list_files',
	outputSchema: amazonS3ListFilesOutputSchema,
	displayName: 'List Files',
	description:
		'Lists files in the connected bucket, optionally under a folder, one page at a time.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists files (object keys) in the connected S3 bucket, optionally under a folder prefix, in key order, one page at a time; pass the returned nextContinuationToken to get the next page. Set "List Folders Separately" to see only the immediate files and subfolders of a prefix instead of every nested file. Use it to find the exact key that the read, copy, move, tag and delete actions need.',
		idempotent: true,
	},
	props: {
		prefix: Property.ShortText({
			displayName: 'Folder Prefix',
			description:
				'Only list keys that start with this prefix, e.g. "invoices/2024/". Leave empty for the whole bucket.',
			required: false,
		}),
		listFoldersSeparately: Property.Checkbox({
			displayName: 'List Folders Separately',
			description:
				'Group keys by "/": return the immediate subfolders under the prefix in "folders" and only the files directly in it in "files".',
			required: false,
			defaultValue: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description:
				'Maximum number of files and folders to return in this page (1–1000). Defaults to 100.',
			required: false,
		}),
		continuationToken: Property.ShortText({
			displayName: 'Continuation Token',
			description: 'The nextContinuationToken from a previous call, to get the next page.',
			required: false,
		}),
		startAfter: Property.ShortText({
			displayName: 'Start After Key',
			description:
				'Only list keys that sort after this key. Ignored when a continuation token is given.',
			required: false,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { prefix, listFoldersSeparately, maxResults, continuationToken, startAfter } =
			context.propsValue;

		const response = await s3AiCommon.call({
			request: () =>
				s3.listObjectsV2({
					Bucket: bucket,
					Prefix: prefix || undefined,
					Delimiter: listFoldersSeparately ? '/' : undefined,
					MaxKeys: Math.min(Math.max(maxResults ?? 100, 1), 1000),
					ContinuationToken: continuationToken || undefined,
					StartAfter: startAfter || undefined,
				}),
		});

		const files = (response.Contents ?? []).map((object) => ({
			key: object.Key ?? null,
			size: object.Size ?? null,
			lastModified: s3AiCommon.toIso(object.LastModified),
			etag: object.ETag ?? null,
			storageClass: object.StorageClass ?? null,
		}));
		const folders = (response.CommonPrefixes ?? []).flatMap((folder) =>
			folder.Prefix ? [folder.Prefix] : [],
		);

		return {
			files,
			folders,
			count: files.length,
			isTruncated: response.IsTruncated ?? false,
			nextContinuationToken: response.NextContinuationToken ?? null,
		};
	},
});
