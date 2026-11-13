import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function pageId<R extends boolean>({
	required,
	displayName = 'Page ID',
	description = 'Numeric page ID, from List Pages, Search Content or the page URL.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function blogPostId<R extends boolean>({
	required,
	displayName = 'Blog Post ID',
	description = 'Numeric blog post ID, from List Blog Posts or Search Content.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function spaceId<R extends boolean>({
	required,
	displayName = 'Space ID',
	description = 'Numeric space ID (not the space key), from List Spaces or Get Space.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function spaceKey<R extends boolean>({
	required,
	displayName = 'Space Key',
	description = 'Space key such as "DOCS" (not the numeric ID), from List Spaces or Get Space.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function attachmentId<R extends boolean>({
	required,
	displayName = 'Attachment ID',
	description = 'Attachment ID starting with "att", from List Page Attachments or Upload Attachment.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function commentId<R extends boolean>({
	required,
	displayName = 'Comment ID',
	description = 'Numeric comment ID, from a comment list or create action.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function propertyId<R extends boolean>({
	required,
	displayName = 'Property ID',
	description = 'Numeric content property ID, from the matching list or create property action.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function propertyKey<R extends boolean>({
	required,
	displayName = 'Property Key',
	description = 'Key of the content property.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function propertyValue<R extends boolean>({
	required,
	displayName = 'Property Value',
	description = 'JSON object or array to store under the key.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function versionNumber<R extends boolean>({
	required,
	displayName = 'Version Number',
	description = 'Version number, from the matching list versions action.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function body<R extends boolean>({
	required,
	displayName = 'Body',
	description = 'Content in the selected body format. Storage format is Confluence XHTML, e.g. "<p>Hello</p>".',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function bodyFormat<R extends boolean>({
	required,
	displayName = 'Body Format',
	description = 'Format of Body. Defaults to storage (XHTML).',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		defaultValue: 'storage',
		options: {
			disabled: false,
			options: [
				{ label: 'Storage (XHTML)', value: 'storage' },
				{ label: 'Atlas Document Format (JSON string)', value: 'atlas_doc_format' },
				{ label: 'Wiki Markup', value: 'wiki' },
			],
		},
	});
}

function readBodyFormat<R extends boolean>({
	required,
	displayName = 'Body Format',
	description = 'Body representation to include in the response. Leave empty to omit the body.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Storage (XHTML)', value: 'storage' },
				{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
			],
		},
	});
}

function contentStatus<R extends boolean>({
	required,
	displayName = 'Status',
	description = 'Published (current) or draft.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Published', value: 'current' },
				{ label: 'Draft', value: 'draft' },
			],
		},
	});
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of items to return (1-250). Defaults to 25.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function cursor<R extends boolean>({
	required,
	displayName = 'Cursor',
	description = 'nextCursor from the previous call with the same filters, to get the next page.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const confluenceAiProps = {
	pageId,
	blogPostId,
	spaceId,
	spaceKey,
	attachmentId,
	commentId,
	propertyId,
	propertyKey,
	propertyValue,
	versionNumber,
	body,
	bodyFormat,
	readBodyFormat,
	contentStatus,
	limit,
	cursor,
};
