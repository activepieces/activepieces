import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const crmObjectFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Record ID' },
	{
		key: 'properties',
		label: 'Properties',
		dynamicKey: true,
		description: 'Requested properties, keyed by their HubSpot internal names.',
	},
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
	{ key: 'archivedAt', label: 'Archived At', format: 'datetime' },
];

const pagingFields: OutputSchemaField[] = [
	{
		key: 'next',
		label: 'Next Page',
		children: [
			{ key: 'after', label: 'After Cursor' },
			{ key: 'link', label: 'Link', format: 'url' },
		],
	},
];

function crmSearchFields({
	itemsLabel,
	labelKey,
}: {
	itemsLabel: string;
	labelKey: string;
}): OutputSchemaField[] {
	return [
		{ key: 'total', label: 'Total Matches', format: 'number' },
		{ key: 'results', label: itemsLabel, labelKey, listItems: crmObjectFields },
		{ key: 'paging', label: 'Paging', children: pagingFields },
	];
}

export const crmObjectOutputSchema: OutputSchema = { fields: crmObjectFields };

export const contactSearchOutputSchema: OutputSchema = {
	fields: crmSearchFields({ itemsLabel: 'Contacts', labelKey: 'properties.email' }),
};

export const companySearchOutputSchema: OutputSchema = {
	fields: crmSearchFields({ itemsLabel: 'Companies', labelKey: 'properties.name' }),
};

export const dealSearchOutputSchema: OutputSchema = {
	fields: crmSearchFields({ itemsLabel: 'Deals', labelKey: 'properties.dealname' }),
};

export const ticketSearchOutputSchema: OutputSchema = {
	fields: crmSearchFields({ itemsLabel: 'Tickets', labelKey: 'properties.subject' }),
};

export const productSearchOutputSchema: OutputSchema = {
	fields: crmSearchFields({ itemsLabel: 'Products', labelKey: 'properties.name' }),
};

export const lineItemSearchOutputSchema: OutputSchema = {
	fields: crmSearchFields({ itemsLabel: 'Line Items', labelKey: 'properties.name' }),
};

const ownerFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Owner ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'userId', label: 'User ID' },
	{ key: 'userIdIncludingInactive', label: 'User ID (Including Inactive)' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
];

export const getOwnerByIdOutputSchema: OutputSchema = { fields: ownerFields };

export const getOwnerByEmailOutputSchema: OutputSchema = {
	fields: [{ key: 'results', label: 'Owners', labelKey: 'email', listItems: ownerFields }],
};

export const pipelineStageDetailsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Stage ID' },
		{ key: 'label', label: 'Label' },
		{ key: 'displayOrder', label: 'Display Order', format: 'number' },
		{ key: 'writePermissions', label: 'Write Permissions' },
		{
			key: 'metadata',
			label: 'Metadata',
			dynamicKey: true,
			description: 'Stage settings, keyed by name; varies between deal and ticket pipelines.',
		},
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
		{ key: 'archived', label: 'Archived', format: 'boolean' },
	],
};

const pageFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Page ID' },
	{ key: 'name', label: 'Internal Page Name' },
	{ key: 'htmlTitle', label: 'Page Title' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'url', label: 'URL', format: 'url' },
	{ key: 'domain', label: 'Domain' },
	{ key: 'state', label: 'State' },
	{ key: 'published', label: 'Published', format: 'boolean' },
	{ key: 'templatePath', label: 'Template Path' },
	{ key: 'language', label: 'Language' },
	{ key: 'authorName', label: 'Author Name' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'archivedAt', label: 'Archived At', format: 'datetime' },
];

export const pageOutputSchema: OutputSchema = { fields: pageFields };

const associationBatchResultFields: OutputSchema['fields'] = [
	{ key: 'fromObjectId', label: 'From Object ID' },
	{ key: 'fromObjectTypeId', label: 'From Object Type ID' },
	{ key: 'toObjectId', label: 'To Object ID' },
	{ key: 'toObjectTypeId', label: 'To Object Type ID' },
	{ key: 'labels', label: 'Labels' },
];

export const createAssociationsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'totalAssociations', label: 'Total Associations', format: 'number' },
		{ key: 'batchCount', label: 'Batch Count', format: 'number' },
		{
			key: 'responses',
			label: 'Batch Responses',
			listItems: [
				{ key: 'status', label: 'Status' },
				{ key: 'startedAt', label: 'Started At', format: 'datetime' },
				{ key: 'completedAt', label: 'Completed At', format: 'datetime' },
				{ key: 'results', label: 'Results', listItems: associationBatchResultFields },
			],
		},
	],
};

export const removeAssociationsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'totalAssociations', label: 'Total Associations', format: 'number' },
		{ key: 'batchCount', label: 'Batch Count', format: 'number' },
		{
			key: 'responses',
			label: 'Batch Responses',
			description: 'One entry per batch; HubSpot returns no content per batch on success.',
		},
	],
};

export const findAssociationsOutputSchema: OutputSchema = {
	itemLabel: 'To Object {toObjectId}',
	fields: [
		{
			key: 'associations',
			label: 'Associations',
			value: '',
			listItems: [
				{ key: 'toObjectId', label: 'To Object ID' },
				{
					key: 'associationTypes',
					label: 'Association Types',
					listItems: [
						{ key: 'typeId', label: 'Type ID', format: 'number' },
						{ key: 'label', label: 'Label' },
						{ key: 'category', label: 'Category' },
					],
				},
			],
		},
	],
};

export const newContactInListTriggerOutputSchema: OutputSchema = {
	fields: [...crmObjectFields, { key: 'membershipTimestamp', label: 'Added to List At', format: 'datetime' }],
};

export const newFormSubmissionTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'conversionId', label: 'Conversion ID' },
		{ key: 'submittedAt', label: 'Submitted At', format: 'datetime' },
		{
			key: 'values',
			label: 'Submitted Values',
			dynamicKey: true,
			description: 'Field values, keyed by the form field label.',
		},
		{ key: 'pageUrl', label: 'Page URL', format: 'url' },
	],
};

export const newEmailSubscriptionsTimelineTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
		{ key: 'recipient', label: 'Recipient', format: 'email' },
		{ key: 'normalizedEmailId', label: 'Normalized Email ID' },
		{ key: 'portalId', label: 'Portal ID', format: 'number' },
		{
			key: 'changes',
			label: 'Changes',
			listItems: [
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
				{ key: 'subscriptionId', label: 'Subscription ID', format: 'number' },
				{ key: 'changeType', label: 'Change Type' },
				{ key: 'change', label: 'Change' },
				{ key: 'source', label: 'Source' },
				{ key: 'portalId', label: 'Portal ID', format: 'number' },
				{
					key: 'causedByEvent',
					label: 'Caused By Event',
					children: [
						{ key: 'id', label: 'Event ID' },
						{ key: 'created', label: 'Created At', format: 'datetime' },
					],
				},
			],
		},
	],
};

export const createBlogPostOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Post ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'title', label: 'Title' },
		{ key: 'slug', label: 'Slug' },
		{ key: 'url', label: 'URL', format: 'url' },
		{ key: 'absolute_url', label: 'Absolute URL', format: 'url' },
		{ key: 'state', label: 'State' },
		{ key: 'currently_published', label: 'Currently Published', format: 'boolean' },
		{ key: 'content_group_id', label: 'Blog ID' },
		{ key: 'blog_author_id', label: 'Author ID' },
		{ key: 'author_name', label: 'Author Name' },
		{ key: 'meta_description', label: 'Meta Description' },
		{ key: 'post_body', label: 'Body', format: 'html' },
		{ key: 'featured_image', label: 'Featured Image', format: 'image' },
		{ key: 'created', label: 'Created At', format: 'datetime' },
		{ key: 'updated', label: 'Updated At', format: 'datetime' },
		{ key: 'publish_date', label: 'Publish Date', format: 'datetime' },
	],
};

export const newBlogArticleTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Post ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'htmlTitle', label: 'Title' },
		{ key: 'slug', label: 'Slug' },
		{ key: 'url', label: 'URL', format: 'url' },
		{ key: 'state', label: 'State' },
		{ key: 'currentState', label: 'Current State' },
		{ key: 'currentlyPublished', label: 'Currently Published', format: 'boolean' },
		{ key: 'contentGroupId', label: 'Blog ID' },
		{ key: 'blogAuthorId', label: 'Author ID' },
		{ key: 'authorName', label: 'Author Name' },
		{ key: 'metaDescription', label: 'Meta Description' },
		{ key: 'postBody', label: 'Body', format: 'html' },
		{ key: 'featuredImage', label: 'Featured Image', format: 'image' },
		{ key: 'created', label: 'Created At', format: 'datetime' },
		{ key: 'updated', label: 'Updated At', format: 'datetime' },
		{ key: 'publishDate', label: 'Publish Date', format: 'datetime' },
		{ key: 'publishedAt', label: 'Published At', format: 'datetime' },
	],
};

export const customObjectSearchOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total Matches', format: 'number' },
		{
			key: 'results',
			label: 'Records',
			listItems: crmObjectFields,
			description: 'No labelKey is set: which property best labels a record varies per custom object type.',
		},
		{ key: 'paging', label: 'Paging', children: pagingFields },
	],
};

export const uploadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'File ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'path', label: 'Path' },
		{ key: 'parentFolderId', label: 'Parent Folder ID' },
		{ key: 'size', label: 'Size', format: 'filesize' },
		{ key: 'type', label: 'Type' },
		{ key: 'extension', label: 'Extension' },
		{ key: 'url', label: 'URL', format: 'url' },
		{ key: 'defaultHostingUrl', label: 'Default Hosting URL', format: 'url' },
		{ key: 'access', label: 'Access Level' },
		{ key: 'isUsableInContent', label: 'Usable In Content', format: 'boolean' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
		{ key: 'archived', label: 'Archived', format: 'boolean' },
	],
};
