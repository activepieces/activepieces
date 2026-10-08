import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3ListFileVersionsOutputSchema } from '../../output-schemas';

export const amazonS3ListFileVersions = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_list_file_versions',
	outputSchema: amazonS3ListFileVersionsOutputSchema,
	displayName: 'List File Versions',
	description: 'Lists the versions and delete markers of files in the connected bucket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every stored version and delete marker of files under a key prefix in the connected S3 bucket, newest first per key, one page at a time; pass nextKeyMarker and nextVersionIdMarker to continue. The returned version ids work with Read File, Get File Metadata and Copy File, e.g. to restore a version by copying it over the current key. On a bucket without versioning each file has one version with id "null".',
		idempotent: true,
	},
	props: {
		prefix: Property.ShortText({
			displayName: 'Key Prefix',
			description:
				'Only list versions of keys that start with this prefix, e.g. a full file key or "reports/". Leave empty for the whole bucket.',
			required: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description:
				'Maximum number of versions and delete markers to return in this page (1–1000). Defaults to 100.',
			required: false,
		}),
		keyMarker: Property.ShortText({
			displayName: 'Key Marker',
			description: 'The nextKeyMarker from a previous call, to get the next page.',
			required: false,
		}),
		versionIdMarker: Property.ShortText({
			displayName: 'Version ID Marker',
			description: 'The nextVersionIdMarker from a previous call; use together with Key Marker.',
			required: false,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { prefix, maxResults, keyMarker, versionIdMarker } = context.propsValue;

		if (versionIdMarker && !keyMarker) {
			throw new Error('Version ID Marker needs Key Marker as well.');
		}

		const response = await s3AiCommon.call({
			request: () =>
				s3.listObjectVersions({
					Bucket: bucket,
					Prefix: prefix || undefined,
					MaxKeys: Math.min(Math.max(maxResults ?? 100, 1), 1000),
					KeyMarker: keyMarker || undefined,
					VersionIdMarker: versionIdMarker || undefined,
				}),
		});

		const versions = (response.Versions ?? []).map((version) => ({
			key: version.Key ?? null,
			versionId: version.VersionId ?? null,
			isLatest: version.IsLatest ?? false,
			size: version.Size ?? null,
			lastModified: s3AiCommon.toIso(version.LastModified),
			etag: version.ETag ?? null,
			storageClass: version.StorageClass ?? null,
		}));
		const deleteMarkers = (response.DeleteMarkers ?? []).map((marker) => ({
			key: marker.Key ?? null,
			versionId: marker.VersionId ?? null,
			isLatest: marker.IsLatest ?? false,
			lastModified: s3AiCommon.toIso(marker.LastModified),
		}));

		return {
			versions,
			deleteMarkers,
			count: versions.length + deleteMarkers.length,
			isTruncated: response.IsTruncated ?? false,
			nextKeyMarker: response.NextKeyMarker ?? null,
			nextVersionIdMarker: response.NextVersionIdMarker ?? null,
		};
	},
});
