import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function siteId<R extends boolean>({
	required,
	displayName = 'Site ID',
	description = 'Webflow site ID, e.g. "580e63e98c9a982ac9b8b741". Use List Sites to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function collectionId<R extends boolean>({
	required,
	displayName = 'Collection ID',
	description = 'CMS collection ID. Use List Collections to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function itemId<R extends boolean>({
	required,
	displayName = 'Item ID',
	description = 'CMS collection item ID. Use List Collection Items to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function pageId<R extends boolean>({
	required,
	displayName = 'Page ID',
	description = 'Page ID. Use List Pages to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of records to return (1-100). Defaults to 100.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function offset<R extends boolean>({
	required,
	displayName = 'Offset',
	description = 'Number of records to skip, for paging. Use the previous response\'s pagination.offset + limit. Defaults to 0.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function flag<R extends boolean>({ required, displayName = 'Enabled', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: 'true' },
				{ label: 'No', value: 'false' },
			],
		},
	});
}

export const webflowAiProps = { siteId, collectionId, itemId, pageId, limit, offset, flag };
