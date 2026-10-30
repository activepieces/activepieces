import { OutputSchema } from '@activepieces/pieces-framework';

const fileFields: OutputSchema['fields'] = [
	{ key: 'key', label: 'File Key' },
	{ key: 'size', label: 'Size', format: 'filesize' },
	{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
	{ key: 'etag', label: 'ETag' },
	{ key: 'storageClass', label: 'Storage Class' },
];

const tagFields: OutputSchema['fields'] = [
	{ key: 'key', label: 'File Key' },
	{ key: 'versionId', label: 'Version ID' },
	{
		key: 'tags',
		label: 'Tags',
		labelKey: 'key',
		listItems: [
			{ key: 'key', label: 'Tag Key' },
			{ key: 'value', label: 'Tag Value' },
		],
	},
	{ key: 'count', label: 'Tag Count', format: 'number' },
];

export const amazonS3ListFilesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'files', label: 'Files', labelKey: 'key', listItems: fileFields },
		{ key: 'folders', label: 'Folders' },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'isTruncated', label: 'Has More', format: 'boolean' },
		{ key: 'nextContinuationToken', label: 'Next Continuation Token' },
	],
};

export const amazonS3GetFileMetadataOutputSchema: OutputSchema = {
	fields: [
		{ key: 'key', label: 'File Key' },
		{ key: 'versionId', label: 'Version ID' },
		{ key: 'size', label: 'Size', format: 'filesize' },
		{ key: 'contentType', label: 'Content Type' },
		{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
		{ key: 'etag', label: 'ETag' },
		{ key: 'storageClass', label: 'Storage Class' },
		{ key: 'contentEncoding', label: 'Content Encoding' },
		{ key: 'contentDisposition', label: 'Content Disposition' },
		{ key: 'cacheControl', label: 'Cache Control' },
		{ key: 'serverSideEncryption', label: 'Server-Side Encryption' },
		{ key: 'metadata', label: 'Custom Metadata', dynamicKey: true },
	],
};

export const amazonS3ReadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'key', label: 'File Key' },
		{ key: 'versionId', label: 'Version ID' },
		{ key: 'contentType', label: 'Content Type' },
		{ key: 'size', label: 'Size', format: 'filesize' },
		{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
		{ key: 'etag', label: 'ETag' },
		{ key: 'content', label: 'Text Content' },
		{ key: 'truncated', label: 'Truncated', format: 'boolean' },
		{ key: 'file', label: 'File', format: 'url' },
	],
};

export const amazonS3UploadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'key', label: 'File Key' },
		{ key: 'contentType', label: 'Content Type' },
		{ key: 'etag', label: 'ETag' },
		{ key: 'versionId', label: 'Version ID' },
	],
};

export const amazonS3CopyFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'sourceKey', label: 'Source File Key' },
		{ key: 'destinationKey', label: 'Destination File Key' },
		{ key: 'sourceVersionId', label: 'Source Version ID' },
		{ key: 'versionId', label: 'Version ID' },
		{ key: 'etag', label: 'ETag' },
		{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
	],
};

export const amazonS3MoveFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'sourceKey', label: 'Source File Key' },
		{ key: 'destinationKey', label: 'Destination File Key' },
		{ key: 'versionId', label: 'Version ID' },
		{ key: 'etag', label: 'ETag' },
		{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
	],
};

export const amazonS3DeleteFilesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'All Deleted', format: 'boolean' },
		{ key: 'deletedCount', label: 'Deleted Count', format: 'number' },
		{ key: 'failedCount', label: 'Failed Count', format: 'number' },
		{
			key: 'deleted',
			label: 'Deleted Files',
			labelKey: 'key',
			listItems: [
				{ key: 'key', label: 'File Key' },
				{ key: 'versionId', label: 'Version ID' },
				{ key: 'deleteMarker', label: 'Delete Marker', format: 'boolean' },
			],
		},
		{ key: 'failed', label: 'Failed Files' },
	],
};

export const amazonS3GetFileTagsOutputSchema: OutputSchema = { fields: tagFields };

export const amazonS3DeleteFileTagsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'key', label: 'File Key' },
		{ key: 'versionId', label: 'Version ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const amazonS3ListFileVersionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'versions',
			label: 'Versions',
			labelKey: 'key',
			listItems: [
				...fileFields,
				{ key: 'versionId', label: 'Version ID' },
				{ key: 'isLatest', label: 'Is Latest', format: 'boolean' },
			],
		},
		{ key: 'deleteMarkers', label: 'Delete Markers' },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'isTruncated', label: 'Has More', format: 'boolean' },
		{ key: 'nextKeyMarker', label: 'Next Key Marker' },
		{ key: 'nextVersionIdMarker', label: 'Next Version ID Marker' },
	],
};

export const generateSignedUrlOutputSchema: OutputSchema = {
	fields: [{ key: 'signedUrl', label: 'Signed URL', value: '', format: 'url' }],
};

export const generateSignedUploadUrlOutputSchema: OutputSchema = {
	fields: [{ key: 'url', label: 'Signed Upload URL', format: 'url' }],
};

export const newFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Key', label: 'File Key' },
		{ key: 'LastModified', label: 'Last Modified', format: 'datetime' },
		{ key: 'ETag', label: 'ETag' },
		{ key: 'Size', label: 'Size', format: 'filesize' },
		{ key: 'StorageClass', label: 'Storage Class' },
		{ key: 'ChecksumAlgorithm', label: 'Checksum Algorithm' },
		{ key: 'ChecksumType', label: 'Checksum Type' },
	],
};

export const deleteFileOutputSchema: OutputSchema = {
	fields: [
		{
			key: '$metadata',
			label: 'Response',
			children: [
				{ key: 'httpStatusCode', label: 'HTTP Status Code', format: 'number' },
				{ key: 'requestId', label: 'Request ID' },
			],
		},
	],
};

export const listFilesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'files', label: 'Files', labelKey: 'key', listItems: fileFields },
		{ key: 'isTruncated', label: 'Has More', format: 'boolean' },
	],
};

export const moveFileOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'CopyObjectResult',
			label: 'Copy Result',
			children: [
				{ key: 'ETag', label: 'ETag' },
				{ key: 'LastModified', label: 'Last Modified', format: 'datetime' },
				{ key: 'ChecksumType', label: 'Checksum Type' },
				{ key: 'ChecksumCRC32', label: 'Checksum CRC32' },
			],
		},
		{ key: 'ServerSideEncryption', label: 'Server-Side Encryption' },
	],
};

export const readFileOutputSchema: OutputSchema = {
	fields: [{ key: 'file', label: 'File', value: '', format: 'url' }],
};

export const uploadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'fileName', label: 'File Key' },
		{ key: 'etag', label: 'ETag' },
	],
};
