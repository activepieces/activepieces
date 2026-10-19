import { OutputSchema } from '@activepieces/pieces-framework';

const profilePictureFields: OutputSchema['fields'] = [
	{ key: 'path', label: 'Path' },
	{ key: 'width', label: 'Width', format: 'number' },
	{ key: 'height', label: 'Height', format: 'number' },
	{ key: 'isDefault', label: 'Is Default', format: 'boolean' },
];

const userFields: OutputSchema['fields'] = [
	{ key: 'type', label: 'Type' },
	{ key: 'accountId', label: 'Account ID' },
	{ key: 'accountType', label: 'Account Type' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'publicName', label: 'Public Name' },
	{ key: 'profilePicture', label: 'Profile Picture', children: profilePictureFields },
	{ key: 'displayName', label: 'Display Name' },
	{ key: 'isExternalCollaborator', label: 'Is External Collaborator', format: 'boolean' },
	{ key: 'isGuest', label: 'Is Guest', format: 'boolean' },
	{ key: 'locale', label: 'Locale' },
	{ key: 'accountStatus', label: 'Account Status' },
	{
		key: '_links',
		label: 'Links',
		children: [{ key: 'self', label: 'API URL' }],
	},
];

const bodyRepresentationFields: OutputSchema['fields'] = [
	{ key: 'representation', label: 'Representation' },
	{ key: 'value', label: 'Value' },
];

const spaceFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'ID', format: 'number' },
	{ key: 'ari', label: 'ARI' },
	{ key: 'key', label: 'Key' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'status', label: 'Status' },
	{
		key: '_links',
		label: 'Links',
		children: [
			{ key: 'webui', label: 'Web UI Path' },
			{ key: 'self', label: 'API URL' },
		],
	},
];

const versionFields: OutputSchema['fields'] = [
	{ key: 'number', label: 'Number', format: 'number' },
	{ key: 'message', label: 'Message' },
	{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
	{ key: 'authorId', label: 'Author ID' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
];

export const confluenceAddLabelsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'prefix', label: 'Prefix' },
				{ key: 'name', label: 'Name' },
				{ key: 'id', label: 'ID' },
				{ key: 'label', label: 'Label' },
			],
		},
		{ key: 'start', label: 'Start', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'size', label: 'Size', format: 'number' },
	],
};

export const confluenceAddSpaceLabelsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'prefix', label: 'Prefix' },
				{ key: 'name', label: 'Name' },
				{ key: 'id', label: 'ID' },
				{ key: 'label', label: 'Label' },
			],
		},
		{ key: 'size', label: 'Size', format: 'number' },
	],
};

export const confluenceListPageAncestorsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceArchivePagesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{
			key: 'links',
			label: 'Links',
			children: [{ key: 'status', label: 'Status' }],
		},
	],
};

export const confluenceCreateFooterCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'attachmentId', label: 'Attachment ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{ key: 'blogPostId', label: 'Blog Post ID' },
		{ key: 'pageId', label: 'Page ID' },
	],
};

export const confluenceListAttachmentCommentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'attachmentId', label: 'Attachment ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListAttachmentLabelsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'prefix', label: 'Prefix' },
				{ key: 'name', label: 'Name' },
				{ key: 'id', label: 'ID' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListAuditRecordsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			listItems: [
				{
					key: 'author',
					label: 'Author',
					children: [
						{ key: 'type', label: 'Type' },
						{ key: 'displayName', label: 'Display Name' },
						{ key: 'operations', label: 'Operations' },
						{ key: 'isExternalCollaborator', label: 'Is External Collaborator', format: 'boolean' },
						{ key: 'username', label: 'Username' },
						{ key: 'userKey', label: 'User Key' },
						{ key: 'accountId', label: 'Account ID' },
						{ key: 'accountType', label: 'Account Type' },
						{ key: 'publicName', label: 'Public Name' },
						{ key: 'externalCollaborator', label: 'External Collaborator', format: 'boolean' },
					],
				},
				{ key: 'remoteAddress', label: 'Remote Address' },
				{ key: 'creationDate', label: 'Creation Date', format: 'datetime' },
				{ key: 'summary', label: 'Summary' },
				{ key: 'description', label: 'Description' },
				{ key: 'category', label: 'Category' },
				{ key: 'sysAdmin', label: 'System Admin', format: 'boolean' },
				{ key: 'superAdmin', label: 'Super Admin', format: 'boolean' },
				{
					key: 'affectedObject',
					label: 'Affected Object',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'objectType', label: 'Object Type' },
					],
				},
				{
					key: 'changedValues',
					label: 'Changed Values',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'oldValue', label: 'Old Value' },
						{ key: 'newValue', label: 'New Value' },
						{ key: 'hiddenOldValue', label: 'Hidden Old Value' },
						{ key: 'hiddenNewValue', label: 'Hidden New Value' },
					],
				},
				{
					key: 'associatedObjects',
					label: 'Associated Objects',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'objectType', label: 'Object Type' },
					],
				},
			],
		},
		{ key: 'start', label: 'Start', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'size', label: 'Size', format: 'number' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
				{ key: 'next', label: 'Next Page Path' },
				{ key: 'self', label: 'API URL' },
			],
		},
	],
};

export const confluenceCreateBlogPostOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'id', label: 'ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceListBlogPostAttachmentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'blogPostId', label: 'Blog Post ID' },
				{ key: 'webuiLink', label: 'Web UI Link' },
				{ key: 'mediaTypeDescription', label: 'Media Type Description' },
				{ key: 'downloadLink', label: 'Download Link' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'id', label: 'ID' },
				{ key: 'comment', label: 'Comment' },
				{ key: 'fileId', label: 'File ID' },
				{ key: 'mediaType', label: 'Media Type' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'fileSize', label: 'File Size', format: 'filesize' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'download', label: 'Download Path' },
						{ key: 'webui', label: 'Web UI Path' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListBlogPostFooterCommentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'blogPostId', label: 'Blog Post ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceCreateInlineCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'blogPostId', label: 'Blog Post ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{ key: 'resolutionStatus', label: 'Resolution Status' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: 'properties',
			label: 'Properties',
			children: [
				{ key: 'inlineMarkerRef', label: 'Inline Marker Ref' },
				{ key: 'inlineOriginalSelection', label: 'Inline Original Selection' },
				{ key: 'inline-marker-ref', label: 'Inline Marker Ref' },
				{ key: 'inline-original-selection', label: 'Inline Original Selection' },
			],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'parentCommentId', label: 'Parent Comment ID' },
	],
};

export const confluenceListBlogPostInlineCommentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'blogPostId', label: 'Blog Post ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: 'properties',
					label: 'Properties',
					children: [
						{ key: 'inlineMarkerRef', label: 'Inline Marker Ref' },
						{ key: 'inlineOriginalSelection', label: 'Inline Original Selection' },
						{ key: 'inline-original-selection', label: 'Inline Original Selection' },
						{ key: 'inline-marker-ref', label: 'Inline Marker Ref' },
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceGetBlogPostLikeCountOutputSchema: OutputSchema = {
	fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const confluenceListBlogPostOperationsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'operations',
			label: 'Operations',
			listItems: [
				{ key: 'operation', label: 'Operation' },
				{ key: 'targetType', label: 'Target Type' },
			],
		},
	],
};

export const confluenceCreateBlogPostPropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'version', label: 'Version', children: versionFields },
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
	],
};

export const confluenceUploadAttachmentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{ key: 'ari', label: 'ARI' },
				{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{
					key: 'version',
					label: 'Version',
					children: [
						{ key: 'by', label: 'By', children: userFields },
						{ key: 'when', label: 'When', format: 'datetime' },
						{ key: 'friendlyWhen', label: 'Friendly When' },
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
						{ key: 'contentTypeModified', label: 'Content Type Modified', format: 'boolean' },
						{
							key: '_links',
							label: 'Links',
							children: [{ key: 'self', label: 'API URL' }],
						},
						{ key: 'message', label: 'Message' },
					],
				},
				{
					key: 'container',
					label: 'Container',
					children: [
						{ key: 'id', label: 'ID' },
						{ key: 'type', label: 'Type' },
						{ key: 'ari', label: 'ARI' },
						{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
						{ key: 'status', label: 'Status' },
						{ key: 'title', label: 'Title' },
						{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
						{
							key: '_links',
							label: 'Links',
							children: [
								{ key: 'self', label: 'API URL' },
								{ key: 'tinyui', label: 'Short Link Path' },
								{ key: 'editui', label: 'Edit UI Path' },
								{ key: 'webui', label: 'Web UI Path' },
								{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
							],
						},
						{
							key: 'extensions',
							label: 'Extensions',
							children: [{ key: 'position', label: 'Position', format: 'number' }],
						},
					],
				},
				{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
				{
					key: 'metadata',
					label: 'Metadata',
					children: [
						{ key: 'mediaType', label: 'Media Type' },
						{
							key: 'labels',
							label: 'Labels',
							children: [
								{ key: 'results', label: 'Results' },
								{ key: 'start', label: 'Start', format: 'number' },
								{ key: 'limit', label: 'Limit', format: 'number' },
								{ key: 'size', label: 'Size', format: 'number' },
								{
									key: '_links',
									label: 'Links',
									children: [
										{ key: 'next', label: 'Next Page Path' },
										{ key: 'self', label: 'API URL' },
									],
								},
							],
						},
						{ key: 'comment', label: 'Comment' },
					],
				},
				{
					key: 'extensions',
					label: 'Extensions',
					children: [
						{ key: 'mediaType', label: 'Media Type' },
						{ key: 'fileSize', label: 'File Size', format: 'filesize' },
						{ key: 'mediaTypeDescription', label: 'Media Type Description' },
						{ key: 'fileId', label: 'File ID' },
						{ key: 'collectionName', label: 'Collection Name' },
						{ key: 'comment', label: 'Comment' },
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'self', label: 'API URL' },
						{ key: 'download', label: 'Download Path' },
					],
				},
			],
		},
		{ key: 'size', label: 'Size', format: 'number' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
			],
		},
	],
};

export const confluenceGetBlogPostVersionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'number', label: 'Number', format: 'number' },
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'message', label: 'Message' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
		{ key: 'contentTypeModified', label: 'Content Type Modified', format: 'boolean' },
		{ key: 'collaborators', label: 'Collaborators' },
		{ key: 'prevVersion', label: 'Previous Version' },
		{ key: 'nextVersion', label: 'Next Version', format: 'number' },
	],
};

export const confluenceListBlogPostVersionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			listItems: [
				{ key: 'number', label: 'Number', format: 'number' },
				{ key: 'message', label: 'Message' },
				{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{
					key: 'blogpost',
					label: 'Blogpost',
					children: [
						{ key: 'id', label: 'ID' },
						{
							key: 'body',
							label: 'Body',
							children: [
								{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
								{
									key: 'atlas_doc_format',
									label: 'Atlas Document Format',
									children: bodyRepresentationFields,
								},
							],
						},
						{ key: 'title', label: 'Title' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListBlogPostsForLabelOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'id', label: 'ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'spaceId', label: 'Space ID' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'tinyui', label: 'Short Link Path' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceCreatePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceListChildPagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'childPosition', label: 'Child Position', format: 'number' },
				{ key: 'type', label: 'Type' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceUpdateTaskOutputSchema: OutputSchema = {
	fields: [
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'assignedTo', label: 'Assigned To' },
		{ key: 'dueAt', label: 'Due At', format: 'datetime' },
		{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
		{ key: 'completedAt', label: 'Completed At', format: 'datetime' },
		{ key: 'completedBy', label: 'Completed By' },
		{ key: 'localId', label: 'Local ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'createdBy', label: 'Created By' },
	],
};

export const confluenceCopyPageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'type', label: 'Type' },
		{ key: 'ari', label: 'ARI' },
		{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'space', label: 'Space', children: spaceFields },
		{
			key: 'history',
			label: 'History',
			children: [
				{ key: 'latest', label: 'Latest', format: 'boolean' },
				{ key: 'createdBy', label: 'Created By', children: userFields },
				{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'version',
			label: 'Version',
			children: [
				{ key: 'by', label: 'By', children: userFields },
				{ key: 'when', label: 'When', format: 'datetime' },
				{ key: 'friendlyWhen', label: 'Friendly When' },
				{ key: 'message', label: 'Message' },
				{ key: 'number', label: 'Number', format: 'number' },
				{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
				{ key: 'confRev', label: 'Confluence Revision' },
				{ key: 'contentTypeModified', label: 'Content Type Modified', format: 'boolean' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
		{
			key: 'extensions',
			label: 'Extensions',
			children: [{ key: 'position', label: 'Position', format: 'number' }],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'context', label: 'Context' },
				{ key: 'self', label: 'API URL' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'collection', label: 'Collection' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceDeleteAttachmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'attachmentId', label: 'Attachment ID' },
	],
};

export const confluenceDeleteBlogPostOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'blogPostId', label: 'Blog Post ID' },
	],
};

export const confluenceDeleteBlogPostPropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'propertyId', label: 'Property ID' },
	],
};

export const confluenceDeletePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'pageId', label: 'Page ID' },
	],
};

export const confluenceDeleteFolderOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'folderId', label: 'Folder ID' },
	],
};

export const confluenceDeleteFooterCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'commentId', label: 'Comment ID' },
	],
};

export const confluenceDeleteSpaceOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'ari', label: 'ARI' },
		{
			key: 'links',
			label: 'Links',
			children: [{ key: 'status', label: 'Status' }],
		},
	],
};

export const confluenceDeleteWhiteboardOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'whiteboardId', label: 'Whiteboard ID' },
	],
};

export const confluenceListPageDescendantsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'parentId', label: 'Parent ID' },
				{ key: 'depth', label: 'Depth', format: 'number' },
				{ key: 'childPosition', label: 'Child Position', format: 'number' },
				{ key: 'type', label: 'Type' },
				{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const findUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'count', label: 'Count', format: 'number' },
		{
			key: 'results',
			label: 'Results',
			labelKey: 'displayName',
			listItems: [
				{ key: 'type', label: 'Type' },
				{ key: 'accountId', label: 'Account ID' },
				{ key: 'accountType', label: 'Account Type' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'publicName', label: 'Public Name' },
				{ key: 'profilePicture', label: 'Profile Picture', children: profilePictureFields },
				{ key: 'displayName', label: 'Display Name' },
				{ key: 'isExternalCollaborator', label: 'Is External Collaborator', format: 'boolean' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
	],
};

export const confluenceCreateFolderOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'type', label: 'Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'title', label: 'Title' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'status', label: 'Status' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceListFooterCommentRepliesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{ key: 'parentCommentId', label: 'Parent Comment ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceGetAttachmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'mediaTypeDescription', label: 'Media Type Description' },
		{ key: 'webuiLink', label: 'Web UI Link' },
		{ key: 'downloadLink', label: 'Download Link' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'comment', label: 'Comment' },
		{ key: 'id', label: 'ID' },
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'fileId', label: 'File ID' },
		{ key: 'mediaType', label: 'Media Type' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'fileSize', label: 'File Size', format: 'filesize' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'download', label: 'Download Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{
			key: 'labels',
			label: 'Labels',
			children: [
				{ key: 'results', label: 'Results' },
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'versions',
			label: 'Versions',
			children: [
				{
					key: 'results',
					label: 'Results',
					listItems: [
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'message', label: 'Message' },
						{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
						{ key: 'authorId', label: 'Author ID' },
						{ key: 'createdAt', label: 'Created At', format: 'datetime' },
						{
							key: 'attachment',
							label: 'Attachment',
							children: [
								{ key: 'body', label: 'Body' },
								{ key: 'title', label: 'Title' },
								{ key: 'id', label: 'ID' },
							],
						},
					],
				},
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
	],
};

export const confluenceGetBlogPostOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'status', label: 'Status' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
				{
					key: 'atlas_doc_format',
					label: 'Atlas Document Format',
					children: bodyRepresentationFields,
				},
				{ key: 'view', label: 'View', children: bodyRepresentationFields },
				{ key: 'export_view', label: 'Export View', children: bodyRepresentationFields },
				{ key: 'styled_view', label: 'Styled View', children: bodyRepresentationFields },
			],
		},
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{
			key: 'labels',
			label: 'Labels',
			children: [
				{ key: 'results', label: 'Results' },
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'properties',
			label: 'Properties',
			children: [
				{ key: 'results', label: 'Results' },
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'versions',
			label: 'Versions',
			children: [
				{
					key: 'results',
					label: 'Results',
					listItems: [
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'message', label: 'Message' },
						{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
						{ key: 'authorId', label: 'Author ID' },
						{ key: 'createdAt', label: 'Created At', format: 'datetime' },
						{
							key: 'blogpost',
							label: 'Blogpost',
							children: [
								{ key: 'id', label: 'ID' },
								{ key: 'body', label: 'Body' },
								{ key: 'title', label: 'Title' },
							],
						},
					],
				},
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
	],
};

export const confluenceGetFooterCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{ key: 'resolutionStatus', label: 'Resolution Status' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
				{
					key: 'atlas_doc_format',
					label: 'Atlas Document Format',
					children: bodyRepresentationFields,
				},
				{ key: 'view', label: 'View', children: bodyRepresentationFields },
			],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceGetInlineCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{ key: 'resolutionStatus', label: 'Resolution Status' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
				{
					key: 'atlas_doc_format',
					label: 'Atlas Document Format',
					children: bodyRepresentationFields,
				},
				{ key: 'view', label: 'View', children: bodyRepresentationFields },
			],
		},
		{
			key: 'properties',
			label: 'Properties',
			children: [
				{ key: 'inlineMarkerRef', label: 'Inline Marker Ref' },
				{ key: 'inlineOriginalSelection', label: 'Inline Original Selection' },
				{ key: 'inline-original-selection', label: 'Inline Original Selection' },
				{ key: 'inline-marker-ref', label: 'Inline Marker Ref' },
			],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceGetLabelOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'label',
			label: 'Label',
			children: [
				{ key: 'prefix', label: 'Prefix' },
				{ key: 'name', label: 'Name' },
				{ key: 'id', label: 'ID' },
				{ key: 'label', label: 'Label' },
			],
		},
		{
			key: 'associatedContents',
			label: 'Associated Contents',
			children: [
				{
					key: 'results',
					label: 'Results',
					labelKey: 'title',
					listItems: [
						{ key: 'contentType', label: 'Content Type' },
						{ key: 'contentId', label: 'Content ID', format: 'number' },
						{ key: 'title', label: 'Title' },
					],
				},
				{ key: 'start', label: 'Start', format: 'number' },
				{ key: 'limit', label: 'Limit', format: 'number' },
				{ key: 'size', label: 'Size', format: 'number' },
			],
		},
	],
};

export const confluenceGetPageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
				{
					key: 'atlas_doc_format',
					label: 'Atlas Document Format',
					children: bodyRepresentationFields,
				},
				{ key: 'view', label: 'View', children: bodyRepresentationFields },
				{ key: 'export_view', label: 'Export View', children: bodyRepresentationFields },
				{ key: 'styled_view', label: 'Styled View', children: bodyRepresentationFields },
			],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'id', label: 'ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{
			key: 'labels',
			label: 'Labels',
			children: [
				{ key: 'results', label: 'Results' },
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'versions',
			label: 'Versions',
			children: [
				{
					key: 'results',
					label: 'Results',
					listItems: [
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'message', label: 'Message' },
						{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
						{ key: 'authorId', label: 'Author ID' },
						{ key: 'createdAt', label: 'Created At', format: 'datetime' },
						{
							key: 'page',
							label: 'Page',
							children: [
								{ key: 'body', label: 'Body' },
								{ key: 'title', label: 'Title' },
								{ key: 'id', label: 'ID' },
							],
						},
					],
				},
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'properties',
			label: 'Properties',
			children: [
				{
					key: 'results',
					label: 'Results',
					labelKey: 'key',
					listItems: [
						{ key: 'version', label: 'Version', children: versionFields },
						{ key: 'value', label: 'Value' },
						{ key: 'key', label: 'Key' },
						{ key: 'id', label: 'ID' },
					],
				},
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
	],
};

export const confluenceGetSpaceOutputSchema: OutputSchema = {
	fields: [
		{ key: 'spaceOwnerId', label: 'Space Owner ID' },
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'homepageId', label: 'Homepage ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'icon', label: 'Icon' },
		{ key: 'name', label: 'Name' },
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
		{ key: 'type', label: 'Type' },
		{
			key: 'description',
			label: 'Description',
			children: [{ key: 'plain', label: 'Plain', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{ key: 'currentActiveAlias', label: 'Current Active Alias' },
		{
			key: 'labels',
			label: 'Labels',
			children: [
				{ key: 'results', label: 'Results' },
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{
			key: 'properties',
			label: 'Properties',
			children: [
				{ key: 'results', label: 'Results' },
				{
					key: 'meta',
					label: 'Meta',
					children: [{ key: 'hasMore', label: 'Has More', format: 'boolean' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
	],
};

export const confluenceGetTaskOutputSchema: OutputSchema = {
	fields: [
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'assignedTo', label: 'Assigned To' },
		{ key: 'dueAt', label: 'Due At', format: 'datetime' },
		{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
		{ key: 'completedAt', label: 'Completed At', format: 'datetime' },
		{ key: 'completedBy', label: 'Completed By' },
		{ key: 'localId', label: 'Local ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'createdBy', label: 'Created By' },
	],
};

export const confluenceGetTemplateOutputSchema: OutputSchema = {
	fields: [
		{ key: 'templateId', label: 'Template ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'description', label: 'Description' },
		{ key: 'space', label: 'Space', children: spaceFields },
		{ key: 'labels', label: 'Labels' },
		{ key: 'templateType', label: 'Template Type' },
		{ key: 'editorVersion', label: 'Editor Version' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{
					key: 'storage',
					label: 'Storage',
					children: [
						{ key: 'value', label: 'Value' },
						{ key: 'representation', label: 'Representation' },
						{ key: 'embeddedContent', label: 'Embedded Content' },
					],
				},
			],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'self', label: 'API URL' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
			],
		},
	],
};

export const confluenceListGroupMembersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'results', label: 'Results' },
		{ key: 'start', label: 'Start', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'size', label: 'Size', format: 'number' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
				{ key: 'self', label: 'API URL' },
			],
		},
	],
};

export const confluenceListGroupsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'managedBy', label: 'Managed By' },
				{ key: 'usageType', label: 'Usage Type' },
				{ key: 'resourceAri', label: 'Resource ARI' },
				{ key: 'type', label: 'Type' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{ key: 'start', label: 'Start', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'size', label: 'Size', format: 'number' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
				{ key: 'next', label: 'Next Page Path' },
				{ key: 'self', label: 'API URL' },
			],
		},
	],
};

export const confluenceListInlineCommentRepliesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{ key: 'parentCommentId', label: 'Parent Comment ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListBlogPostPropertiesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'key',
			listItems: [
				{ key: 'version', label: 'Version', children: versionFields },
				{
					key: 'value',
					label: 'Value',
				},
				{ key: 'key', label: 'Key' },
				{ key: 'id', label: 'ID' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListBlogPostsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'id', label: 'ID' },
				{ key: 'spaceId', label: 'Space ID' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'tinyui', label: 'Short Link Path' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListPagePropertiesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'key',
			listItems: [
				{
					key: 'value',
					label: 'Value',
				},
				{ key: 'key', label: 'Key' },
				{ key: 'id', label: 'ID' },
				{ key: 'version', label: 'Version', children: versionFields },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListPagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'parentType', label: 'Parent Type' },
				{ key: 'parentId', label: 'Parent ID' },
				{ key: 'ownerId', label: 'Owner ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'lastOwnerId', label: 'Last Owner ID' },
				{ key: 'position', label: 'Position', format: 'number' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'id', label: 'ID' },
				{ key: 'spaceId', label: 'Space ID' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'tinyui', label: 'Short Link Path' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListSpacePropertiesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'key',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'key', label: 'Key' },
				{
					key: 'value',
					label: 'Value',
				},
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'authorId', label: 'Author ID' },
				{
					key: 'version',
					label: 'Version',
					children: [
						{ key: 'createdAt', label: 'Created At', format: 'datetime' },
						{ key: 'authorId', label: 'Author ID' },
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'message', label: 'Message' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListSpacesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'spaceOwnerId', label: 'Space Owner ID' },
				{ key: 'homepageId', label: 'Homepage ID' },
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'icon', label: 'Icon' },
				{ key: 'name', label: 'Name' },
				{ key: 'key', label: 'Key' },
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{
					key: 'description',
					label: 'Description',
					children: [{ key: 'plain', label: 'Plain', children: bodyRepresentationFields }],
				},
				{ key: 'status', label: 'Status' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
				{ key: 'currentActiveAlias', label: 'Current Active Alias' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const listSpacesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'count', label: 'Count', format: 'number' },
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'spaceOwnerId', label: 'Space Owner ID' },
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'homepageId', label: 'Homepage ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'icon', label: 'Icon' },
				{ key: 'description', label: 'Description' },
				{ key: 'status', label: 'Status' },
				{ key: 'name', label: 'Name' },
				{ key: 'key', label: 'Key' },
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
				{ key: 'currentActiveAlias', label: 'Current Active Alias' },
			],
		},
	],
};

export const confluenceListTasksOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'id',
			listItems: [
				{ key: 'pageId', label: 'Page ID' },
				{ key: 'assignedTo', label: 'Assigned To' },
				{ key: 'dueAt', label: 'Due At', format: 'datetime' },
				{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
				{ key: 'completedAt', label: 'Completed At', format: 'datetime' },
				{ key: 'completedBy', label: 'Completed By' },
				{ key: 'localId', label: 'Local ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'id', label: 'ID' },
				{ key: 'spaceId', label: 'Space ID' },
				{
					key: 'body',
					label: 'Body',
					children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
				},
				{ key: 'status', label: 'Status' },
				{ key: 'createdBy', label: 'Created By' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListWhiteboardPropertiesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'key',
			listItems: [
				{ key: 'version', label: 'Version', children: versionFields },
				{
					key: 'value',
					label: 'Value',
				},
				{ key: 'key', label: 'Key' },
				{ key: 'id', label: 'ID' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceGetLongTaskOutputSchema: OutputSchema = {
	fields: [
		{ key: 'ari', label: 'ARI' },
		{ key: 'id', label: 'ID' },
		{
			key: 'name',
			label: 'Name',
			children: [
				{ key: 'key', label: 'Key' },
				{ key: 'args', label: 'Args' },
			],
		},
		{ key: 'elapsedTime', label: 'Elapsed Time', format: 'duration' },
		{ key: 'percentageComplete', label: 'Percentage Complete', format: 'number' },
		{ key: 'successful', label: 'Successful', format: 'boolean' },
		{ key: 'finished', label: 'Finished', format: 'boolean' },
		{
			key: 'messages',
			label: 'Messages',
			listItems: [
				{ key: 'translation', label: 'Translation' },
				{ key: 'args', label: 'Args' },
			],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'errors', label: 'Errors' },
		{ key: 'additionalDetails', label: 'Additional Details' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
			],
		},
	],
};

export const confluenceGetCurrentUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'type', label: 'Type' },
		{ key: 'accountId', label: 'Account ID' },
		{ key: 'accountType', label: 'Account Type' },
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'publicName', label: 'Public Name' },
		{ key: 'profilePicture', label: 'Profile Picture', children: profilePictureFields },
		{ key: 'displayName', label: 'Display Name' },
		{ key: 'isExternalCollaborator', label: 'Is External Collaborator', format: 'boolean' },
		{ key: 'isGuest', label: 'Is Guest', format: 'boolean' },
		{ key: 'locale', label: 'Locale' },
		{ key: 'accountStatus', label: 'Account Status' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'self', label: 'API URL' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
			],
		},
	],
};

export const confluenceMovePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'position', label: 'Position' },
		{ key: 'targetId', label: 'Target ID' },
	],
};

export const findPageByTitleOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'count', label: 'Count', format: 'number' },
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'parentType', label: 'Parent Type' },
				{ key: 'parentId', label: 'Parent ID' },
				{ key: 'ownerId', label: 'Owner ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'lastOwnerId', label: 'Last Owner ID' },
				{ key: 'position', label: 'Position', format: 'number' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'spaceId', label: 'Space ID' },
				{ key: 'body', label: 'Body' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'id', label: 'ID' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'tinyui', label: 'Short Link Path' },
					],
				},
			],
		},
	],
};

export const getPageByUrlOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
				{
					key: 'atlas_doc_format',
					label: 'Atlas Document Format',
					children: bodyRepresentationFields,
				},
				{ key: 'view', label: 'View', children: bodyRepresentationFields },
			],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const publishDraftOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const addCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const createPageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'id', label: 'ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const deletePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'pageId', label: 'Page ID' },
	],
};

export const downloadAttachmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'file', label: 'File', format: 'url' },
		{
			key: 'attachment',
			label: 'Attachment',
			children: [
				{ key: 'mediaTypeDescription', label: 'Media Type Description' },
				{ key: 'webuiLink', label: 'Web UI Link' },
				{ key: 'downloadLink', label: 'Download Link' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'comment', label: 'Comment' },
				{ key: 'id', label: 'ID' },
				{ key: 'pageId', label: 'Page ID' },
				{ key: 'mediaType', label: 'Media Type' },
				{ key: 'fileId', label: 'File ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'fileSize', label: 'File Size', format: 'filesize' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'download', label: 'Download Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'base', label: 'Site Base URL', format: 'url' },
					],
				},
			],
		},
	],
};

export const getpagecontentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'id', label: 'ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{
			key: 'children',
			label: 'Children',
			labelKey: 'title',
			listItems: [
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'parentType', label: 'Parent Type' },
				{ key: 'parentId', label: 'Parent ID' },
				{ key: 'ownerId', label: 'Owner ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'lastOwnerId', label: 'Last Owner ID' },
				{ key: 'position', label: 'Position', format: 'number' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'spaceId', label: 'Space ID' },
				{
					key: 'body',
					label: 'Body',
					children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
				},
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'id', label: 'ID' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'tinyui', label: 'Short Link Path' },
						{ key: 'base', label: 'Site Base URL', format: 'url' },
					],
				},
				{ key: 'children', label: 'Children' },
			],
		},
	],
};

export const listAttachmentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'webuiLink', label: 'Web UI Link' },
				{ key: 'mediaTypeDescription', label: 'Media Type Description' },
				{ key: 'downloadLink', label: 'Download Link' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'comment', label: 'Comment' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'id', label: 'ID' },
				{ key: 'pageId', label: 'Page ID' },
				{ key: 'mediaType', label: 'Media Type' },
				{ key: 'fileId', label: 'File ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'fileSize', label: 'File Size', format: 'filesize' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'download', label: 'Download Path' },
						{ key: 'webui', label: 'Web UI Path' },
					],
				},
			],
		},
	],
};

export const listCommentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{
			key: 'footer',
			label: 'Footer',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{
			key: 'inline',
			label: 'Inline',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: 'properties',
					label: 'Properties',
					children: [
						{ key: 'inlineMarkerRef', label: 'Inline Marker Ref' },
						{ key: 'inlineOriginalSelection', label: 'Inline Original Selection' },
						{ key: 'inline-original-selection', label: 'Inline Original Selection' },
						{ key: 'inline-marker-ref', label: 'Inline Marker Ref' },
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
				{ key: 'resolutionLastModifierId', label: 'Resolution Last Modifier ID' },
				{
					key: 'resolutionLastModifiedAt',
					label: 'Resolution Last Modified At',
					format: 'datetime',
				},
			],
		},
	],
};

export const movePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'position', label: 'Position' },
		{ key: 'targetPageId', label: 'Target Page ID' },
	],
};

export const removeLabelOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'label', label: 'Label' },
	],
};

export const searchPagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{ key: 'ari', label: 'ARI' },
				{ key: 'base64EncodedAri', label: 'Base64 Encoded Ari' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{
					key: 'version',
					label: 'Version',
					children: [
						{ key: 'by', label: 'By', children: userFields },
						{ key: 'when', label: 'When', format: 'datetime' },
						{ key: 'friendlyWhen', label: 'Friendly When' },
						{ key: 'message', label: 'Message' },
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
						{ key: 'confRev', label: 'Conf Rev' },
						{ key: 'contentTypeModified', label: 'Content Type Modified', format: 'boolean' },
						{
							key: '_links',
							label: 'Links',
							children: [{ key: 'self', label: 'API URL' }],
						},
					],
				},
				{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
				{
					key: 'extensions',
					label: 'Extensions',
					children: [
						{ key: 'position', label: 'Position', format: 'number' },
						{ key: 'mediaType', label: 'Media Type' },
						{ key: 'fileSize', label: 'File Size', format: 'number' },
						{ key: 'comment', label: 'Comment' },
						{ key: 'mediaTypeDescription', label: 'Media Type Description' },
						{ key: 'fileId', label: 'File ID' },
						{ key: 'collectionName', label: 'Collection Name' },
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'self', label: 'API URL' },
						{ key: 'tinyui', label: 'Short Link Path' },
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'download', label: 'Download Path' },
					],
				},
				{
					key: 'space',
					label: 'Space',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'ari', label: 'ARI' },
						{ key: 'key', label: 'Key' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'name', label: 'Name' },
						{ key: 'type', label: 'Type' },
						{ key: 'status', label: 'Status' },
						{
							key: '_links',
							label: 'Links',
							children: [
								{ key: 'webui', label: 'Web UI Path' },
								{ key: 'self', label: 'API URL' },
							],
						},
					],
				},
				{
					key: 'history',
					label: 'History',
					children: [
						{ key: 'latest', label: 'Latest', format: 'boolean' },
						{ key: 'createdBy', label: 'Created By', children: userFields },
						{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
						{
							key: '_links',
							label: 'Links',
							children: [{ key: 'self', label: 'API URL' }],
						},
					],
				},
				{
					key: 'body',
					label: 'Body',
					children: [
						{
							key: 'storage',
							label: 'Storage',
							children: [
								{ key: 'value', label: 'Value' },
								{ key: 'representation', label: 'Representation' },
								{ key: 'embeddedContent', label: 'Embedded Content' },
							],
						},
					],
				},
				{
					key: 'metadata',
					label: 'Metadata',
					children: [{ key: 'mediaType', label: 'Media Type' }],
				},
				{ key: 'childTypes', label: 'Child Types' },
				{ key: 'restrictions', label: 'Restrictions' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const updatePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'id', label: 'ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const uploadAttachmentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{ key: 'ari', label: 'ARI' },
				{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{
					key: 'version',
					label: 'Version',
					children: [
						{ key: 'by', label: 'By', children: userFields },
						{ key: 'when', label: 'When', format: 'datetime' },
						{ key: 'friendlyWhen', label: 'Friendly When' },
						{ key: 'message', label: 'Message' },
						{ key: 'number', label: 'Number', format: 'number' },
						{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
						{ key: 'contentTypeModified', label: 'Content Type Modified', format: 'boolean' },
						{
							key: '_links',
							label: 'Links',
							children: [{ key: 'self', label: 'API URL' }],
						},
					],
				},
				{
					key: 'container',
					label: 'Container',
					children: [
						{ key: 'id', label: 'ID' },
						{ key: 'type', label: 'Type' },
						{ key: 'ari', label: 'ARI' },
						{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
						{ key: 'status', label: 'Status' },
						{ key: 'title', label: 'Title' },
						{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
						{
							key: 'extensions',
							label: 'Extensions',
							children: [{ key: 'position', label: 'Position', format: 'number' }],
						},
						{
							key: '_links',
							label: 'Links',
							children: [
								{ key: 'self', label: 'API URL' },
								{ key: 'tinyui', label: 'Short Link Path' },
								{ key: 'editui', label: 'Edit UI Path' },
								{ key: 'webui', label: 'Web UI Path' },
								{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
							],
						},
					],
				},
				{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
				{
					key: 'metadata',
					label: 'Metadata',
					children: [
						{ key: 'comment', label: 'Comment' },
						{ key: 'mediaType', label: 'Media Type' },
						{
							key: 'labels',
							label: 'Labels',
							children: [
								{ key: 'results', label: 'Results' },
								{ key: 'start', label: 'Start', format: 'number' },
								{ key: 'limit', label: 'Limit', format: 'number' },
								{ key: 'size', label: 'Size', format: 'number' },
								{
									key: '_links',
									label: 'Links',
									children: [
										{ key: 'next', label: 'Next Page Path' },
										{ key: 'self', label: 'API URL' },
									],
								},
							],
						},
					],
				},
				{
					key: 'extensions',
					label: 'Extensions',
					children: [
						{ key: 'mediaType', label: 'Media Type' },
						{ key: 'fileSize', label: 'File Size', format: 'filesize' },
						{ key: 'comment', label: 'Comment' },
						{ key: 'mediaTypeDescription', label: 'Media Type Description' },
						{ key: 'fileId', label: 'File ID' },
						{ key: 'collectionName', label: 'Collection Name' },
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'self', label: 'API URL' },
						{ key: 'download', label: 'Download Path' },
					],
				},
			],
		},
		{ key: 'size', label: 'Size', format: 'number' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
			],
		},
	],
};

export const confluenceListPageAttachmentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'webuiLink', label: 'Web UI Link' },
				{ key: 'mediaTypeDescription', label: 'Media Type Description' },
				{ key: 'downloadLink', label: 'Download Link' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'pageId', label: 'Page ID' },
				{ key: 'comment', label: 'Comment' },
				{ key: 'mediaType', label: 'Media Type' },
				{ key: 'fileId', label: 'File ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'fileSize', label: 'File Size', format: 'filesize' },
				{ key: 'id', label: 'ID' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'download', label: 'Download Path' },
						{ key: 'webui', label: 'Web UI Path' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListPageFooterCommentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceListPageInlineCommentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'pageId', label: 'Page ID' },
				{
					key: 'version',
					label: 'Version',
					children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
				},
				{ key: 'resolutionStatus', label: 'Resolution Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{
					key: 'properties',
					label: 'Properties',
					children: [
						{ key: 'inlineMarkerRef', label: 'Inline Marker Ref' },
						{ key: 'inlineOriginalSelection', label: 'Inline Original Selection' },
						{ key: 'inline-original-selection', label: 'Inline Original Selection' },
						{ key: 'inline-marker-ref', label: 'Inline Marker Ref' },
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'webui', label: 'Web UI Path' }],
				},
				{ key: 'resolutionLastModifierId', label: 'Resolution Last Modifier ID' },
				{
					key: 'resolutionLastModifiedAt',
					label: 'Resolution Last Modified At',
					format: 'datetime',
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceCreatePagePropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'version', label: 'Version', children: versionFields },
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
	],
};

export const confluenceListPagesForLabelOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'parentType', label: 'Parent Type' },
				{ key: 'parentId', label: 'Parent ID' },
				{ key: 'ownerId', label: 'Owner ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'lastOwnerId', label: 'Last Owner ID' },
				{ key: 'version', label: 'Version', children: versionFields },
				{ key: 'position', label: 'Position' },
				{ key: 'spaceId', label: 'Space ID' },
				{ key: 'status', label: 'Status' },
				{
					key: 'body',
					label: 'Body',
					children: [
						{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
						{
							key: 'atlas_doc_format',
							label: 'Atlas Document Format',
							children: bodyRepresentationFields,
						},
					],
				},
				{ key: 'title', label: 'Title' },
				{ key: 'id', label: 'ID' },
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
						{ key: 'tinyui', label: 'Short Link Path' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceRemoveLabelOutputSchema: OutputSchema = {
	fields: [
		{ key: 'removed', label: 'Removed', format: 'boolean' },
		{ key: 'contentId', label: 'Content ID' },
		{ key: 'label', label: 'Label' },
	],
};

export const confluenceRemoveSpaceLabelOutputSchema: OutputSchema = {
	fields: [
		{ key: 'removed', label: 'Removed', format: 'boolean' },
		{ key: 'spaceKey', label: 'Space Key' },
		{ key: 'label', label: 'Label' },
	],
};

export const replyToCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'parentCommentId', label: 'Parent Comment ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceUpdateInlineCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{ key: 'resolutionStatus', label: 'Resolution Status' },
		{ key: 'resolutionLastModifierId', label: 'Resolution Last Modifier ID' },
		{ key: 'resolutionLastModifiedAt', label: 'Resolution Last Modified At', format: 'datetime' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: 'properties',
			label: 'Properties',
			children: [
				{ key: 'inlineMarkerRef', label: 'Inline Marker Ref' },
				{ key: 'inlineOriginalSelection', label: 'Inline Original Selection' },
				{ key: 'inline-original-selection', label: 'Inline Original Selection' },
				{ key: 'inline-marker-ref', label: 'Inline Marker Ref' },
			],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceRestorePageVersionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'by', label: 'By', children: userFields },
		{ key: 'when', label: 'When', format: 'datetime' },
		{ key: 'friendlyWhen', label: 'Friendly When' },
		{ key: 'message', label: 'Message' },
		{ key: 'number', label: 'Number', format: 'number' },
		{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
		{ key: 'confRev', label: 'Confluence Revision' },
		{ key: 'contentTypeModified', label: 'Content Type Modified', format: 'boolean' },
		{
			key: 'content',
			label: 'Content',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{ key: 'ari', label: 'ARI' },
				{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
				{
					key: 'extensions',
					label: 'Extensions',
					children: [{ key: 'position', label: 'Position', format: 'number' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'self', label: 'API URL' },
						{ key: 'tinyui', label: 'Short Link Path' },
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
					],
				},
			],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'self', label: 'API URL' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
			],
		},
	],
};

export const confluenceGetContentRestrictionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			listItems: [
				{ key: 'operation', label: 'Operation' },
				{
					key: 'restrictions',
					label: 'Restrictions',
					children: [
						{
							key: 'user',
							label: 'User',
							children: [
								{
									key: 'results',
									label: 'Results',
									labelKey: 'displayName',
									listItems: [
										{ key: 'type', label: 'Type' },
										{ key: 'accountId', label: 'Account ID' },
										{ key: 'accountType', label: 'Account Type' },
										{ key: 'email', label: 'Email', format: 'email' },
										{ key: 'publicName', label: 'Public Name' },
										{ key: 'profilePicture', label: 'Profile Picture' },
										{ key: 'displayName', label: 'Display Name' },
										{
											key: 'isExternalCollaborator',
											label: 'Is External Collaborator',
											format: 'boolean',
										},
										{ key: 'isGuest', label: 'Is Guest', format: 'boolean' },
										{ key: 'locale', label: 'Locale' },
										{ key: 'accountStatus', label: 'Account Status' },
										{ key: '_links', label: 'Links' },
									],
								},
								{ key: 'start', label: 'Start', format: 'number' },
								{ key: 'limit', label: 'Limit', format: 'number' },
								{ key: 'size', label: 'Size', format: 'number' },
							],
						},
						{
							key: 'group',
							label: 'Group',
							children: [
								{ key: 'results', label: 'Results' },
								{ key: 'start', label: 'Start', format: 'number' },
								{ key: 'limit', label: 'Limit', format: 'number' },
								{ key: 'size', label: 'Size', format: 'number' },
							],
						},
					],
				},
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{ key: 'start', label: 'Start', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'size', label: 'Size', format: 'number' },
		{ key: 'restrictionsHash', label: 'Restrictions Hash' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'context', label: 'Context' },
				{ key: 'self', label: 'API URL' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'byOperation', label: 'By Operation', format: 'url' },
			],
		},
	],
};

export const confluenceSearchContentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{
					key: 'content',
					label: 'Content',
					children: [
						{ key: 'id', label: 'ID' },
						{ key: 'type', label: 'Type' },
						{ key: 'status', label: 'Status' },
						{ key: 'title', label: 'Title' },
						{ key: 'childTypes', label: 'Child Types' },
						{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
						{ key: 'restrictions', label: 'Restrictions' },
						{
							key: '_links',
							label: 'Links',
							children: [
								{ key: 'webui', label: 'Web UI Path' },
								{ key: 'self', label: 'API URL' },
								{ key: 'tinyui', label: 'Short Link Path' },
							],
						},
					],
				},
				{ key: 'title', label: 'Title' },
				{ key: 'excerpt', label: 'Excerpt' },
				{ key: 'url', label: 'URL' },
				{
					key: 'resultGlobalContainer',
					label: 'Result Global Container',
					children: [
						{ key: 'title', label: 'Title' },
						{ key: 'displayUrl', label: 'Display URL' },
					],
				},
				{ key: 'breadcrumbs', label: 'Breadcrumbs' },
				{ key: 'entityType', label: 'Entity Type' },
				{ key: 'iconCssClass', label: 'Icon CSS Class' },
				{ key: 'lastModified', label: 'Last Modified', format: 'datetime' },
				{ key: 'friendlyLastModified', label: 'Friendly Last Modified' },
				{ key: 'score', label: 'Score', format: 'number' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceCreateSpaceOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'homepageId', label: 'Homepage ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'icon', label: 'Icon' },
		{ key: 'name', label: 'Name' },
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
		{ key: 'type', label: 'Type' },
		{
			key: 'description',
			label: 'Description',
			children: [{ key: 'plain', label: 'Plain', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
		{ key: 'currentActiveAlias', label: 'Current Active Alias' },
	],
};

export const confluenceCreateSpacePropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'key', label: 'Key' },
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'authorId', label: 'Author ID' },
		{
			key: 'version',
			label: 'Version',
			children: [
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'number', label: 'Number', format: 'number' },
				{ key: 'message', label: 'Message' },
			],
		},
	],
};

export const newAttachmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'mediaTypeDescription', label: 'Media Type Description' },
		{ key: 'webuiLink', label: 'Web UI Link' },
		{ key: 'fileId', label: 'File ID' },
		{ key: 'downloadLink', label: 'Download Link' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'comment', label: 'Comment' },
		{ key: 'id', label: 'ID' },
		{ key: 'pageId', label: 'Page ID' },
		{ key: 'mediaType', label: 'Media Type' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'fileSize', label: 'File Size', format: 'filesize' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'download', label: 'Download Path' },
				{ key: 'webui', label: 'Web UI Path' },
			],
		},
	],
};

export const newBlogPostOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'body', label: 'Body' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'id', label: 'ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
			],
		},
	],
};

export const newCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{ key: 'resolutionStatus', label: 'Resolution Status' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: '_links',
			label: 'Links',
			children: [{ key: 'webui', label: 'Web UI Path' }],
		},
	],
};

export const newPageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'body', label: 'Body' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'id', label: 'ID' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
			],
		},
	],
};

export const updatedPageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'body', label: 'Body' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
			],
		},
	],
};

export const confluenceListTemplatesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'name',
			listItems: [
				{ key: 'templateId', label: 'Template ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'space', label: 'Space', children: spaceFields },
				{ key: 'labels', label: 'Labels' },
				{ key: 'templateType', label: 'Template Type' },
				{ key: 'editorVersion', label: 'Editor Version' },
				{
					key: '_links',
					label: 'Links',
					children: [{ key: 'self', label: 'API URL' }],
				},
			],
		},
		{ key: 'start', label: 'Start', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'size', label: 'Size', format: 'number' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'base', label: 'Site Base URL', format: 'url' },
				{ key: 'context', label: 'Context' },
				{ key: 'self', label: 'API URL' },
			],
		},
	],
};

export const confluenceUpdateBlogPostOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'status', label: 'Status' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceUpdateFooterCommentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{ key: 'pageId', label: 'Page ID' },
		{
			key: 'version',
			label: 'Version',
			children: [...versionFields, { key: 'contributorIds', label: 'Contributor IDs' }],
		},
		{ key: 'resolutionStatus', label: 'Resolution Status' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceUpdatePageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'id', label: 'ID' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'spaceId', label: 'Space ID' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'storage', label: 'Storage', children: bodyRepresentationFields }],
		},
		{ key: 'status', label: 'Status' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceUpdatePagePropertyOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
		{ key: 'version', label: 'Version', children: versionFields },
	],
};

export const confluenceUpdateSpaceOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID', format: 'number' },
		{ key: 'ari', label: 'ARI' },
		{ key: 'key', label: 'Key' },
		{ key: 'alias', label: 'Alias' },
		{ key: 'name', label: 'Name' },
		{
			key: 'description',
			label: 'Description',
			children: [
				{
					key: 'plain',
					label: 'Plain',
					children: [
						{ key: 'value', label: 'Value' },
						{ key: 'representation', label: 'Representation' },
						{ key: 'embeddedContent', label: 'Embedded Content' },
					],
				},
			],
		},
		{
			key: 'homepage',
			label: 'Homepage',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'type', label: 'Type' },
				{ key: 'ari', label: 'ARI' },
				{ key: 'base64EncodedAri', label: 'Base64 Encoded ARI' },
				{ key: 'status', label: 'Status' },
				{ key: 'title', label: 'Title' },
				{ key: 'macroRenderedOutput', label: 'Macro Rendered Output' },
				{
					key: 'extensions',
					label: 'Extensions',
					children: [{ key: 'position', label: 'Position', format: 'number' }],
				},
				{
					key: '_links',
					label: 'Links',
					children: [
						{ key: 'self', label: 'API URL' },
						{ key: 'tinyui', label: 'Short Link Path' },
						{ key: 'editui', label: 'Edit UI Path' },
						{ key: 'webui', label: 'Web UI Path' },
						{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
					],
				},
			],
		},
		{ key: 'type', label: 'Type' },
		{
			key: 'permissions',
			label: 'Permissions',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{
					key: 'subjects',
					label: 'Subjects',
					children: [
						{
							key: 'user',
							label: 'User',
							children: [
								{
									key: 'results',
									label: 'Results',
									labelKey: 'displayName',
									listItems: [
										{ key: 'type', label: 'Type' },
										{ key: 'accountId', label: 'Account ID' },
										{ key: 'accountType', label: 'Account Type' },
										{ key: 'email', label: 'Email', format: 'email' },
										{ key: 'publicName', label: 'Public Name' },
										{ key: 'profilePicture', label: 'Profile Picture' },
										{ key: 'displayName', label: 'Display Name' },
										{
											key: 'isExternalCollaborator',
											label: 'Is External Collaborator',
											format: 'boolean',
										},
										{ key: 'isGuest', label: 'Is Guest', format: 'boolean' },
										{ key: 'accountStatus', label: 'Account Status' },
										{ key: '_links', label: 'Links' },
										{ key: 'locale', label: 'Locale' },
									],
								},
								{ key: 'size', label: 'Size', format: 'number' },
							],
						},
						{
							key: 'group',
							label: 'Group',
							children: [
								{
									key: 'results',
									label: 'Results',
									labelKey: 'name',
									listItems: [
										{ key: 'id', label: 'ID' },
										{ key: 'name', label: 'Name' },
										{ key: 'resourceAri', label: 'Resource ARI' },
										{ key: 'type', label: 'Type' },
										{ key: '_links', label: 'Links' },
									],
								},
								{ key: 'size', label: 'Size', format: 'number' },
							],
						},
					],
				},
				{
					key: 'operation',
					label: 'Operation',
					children: [
						{ key: 'operation', label: 'Operation' },
						{ key: 'targetType', label: 'Target Type' },
					],
				},
				{ key: 'anonymousAccess', label: 'Anonymous Access', format: 'boolean' },
				{ key: 'unlicensedAccess', label: 'Unlicensed Access', format: 'boolean' },
			],
		},
		{ key: 'status', label: 'Status' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'context', label: 'Context' },
				{ key: 'self', label: 'API URL' },
				{ key: 'collection', label: 'Collection' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceUpdateSpacePropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'key', label: 'Key' },
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'authorId', label: 'Author ID' },
		{
			key: 'version',
			label: 'Version',
			children: [
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'number', label: 'Number', format: 'number' },
				{ key: 'message', label: 'Message' },
			],
		},
	],
};

export const confluenceUpdatePageTitleOutputSchema: OutputSchema = {
	fields: [
		{ key: 'authorId', label: 'Author ID' },
		{ key: 'parentType', label: 'Parent Type' },
		{ key: 'parentId', label: 'Parent ID' },
		{ key: 'ownerId', label: 'Owner ID' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'lastOwnerId', label: 'Last Owner ID' },
		{ key: 'position', label: 'Position', format: 'number' },
		{ key: 'version', label: 'Version', children: versionFields },
		{ key: 'id', label: 'ID' },
		{ key: 'spaceId', label: 'Space ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'body', label: 'Body' },
		{ key: 'title', label: 'Title' },
		{
			key: '_links',
			label: 'Links',
			children: [
				{ key: 'editui', label: 'Edit UI Path' },
				{ key: 'webui', label: 'Web UI Path' },
				{ key: 'edituiv2', label: 'Edit UI Path (v2)' },
				{ key: 'tinyui', label: 'Short Link Path' },
				{ key: 'base', label: 'Site Base URL', format: 'url' },
			],
		},
	],
};

export const confluenceUpdateWhiteboardPropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'version', label: 'Version', children: versionFields },
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
	],
};

export const confluenceListPageVersionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			listItems: [
				{ key: 'number', label: 'Number', format: 'number' },
				{ key: 'message', label: 'Message' },
				{ key: 'minorEdit', label: 'Minor Edit', format: 'boolean' },
				{ key: 'authorId', label: 'Author ID' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{
					key: 'page',
					label: 'Page',
					children: [
						{ key: 'id', label: 'ID' },
						{
							key: 'body',
							label: 'Body',
							children: [
								{ key: 'storage', label: 'Storage', children: bodyRepresentationFields },
								{
									key: 'atlas_doc_format',
									label: 'Atlas Document Format',
									children: bodyRepresentationFields,
								},
							],
						},
						{ key: 'title', label: 'Title' },
					],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const confluenceGetPageViewersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID', format: 'number' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const confluenceCreateWhiteboardPropertyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'version', label: 'Version', children: versionFields },
		{
			key: 'value',
			label: 'Value',
		},
		{ key: 'key', label: 'Key' },
		{ key: 'id', label: 'ID' },
	],
};
