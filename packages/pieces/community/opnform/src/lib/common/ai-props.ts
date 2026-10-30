import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace ID',
	description = 'Numeric workspace ID, e.g. "12". Use List Workspaces to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function formId<R extends boolean>({
	required,
	displayName = 'Form ID',
	description = 'Numeric form ID (the `id` field, not the slug), e.g. "42". Use List Forms to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function formSlug<R extends boolean>({
	required,
	displayName = 'Form Slug',
	description = 'The form slug or UUID (the `slug` field), e.g. "customer-feedback-x1y2z3". Use List Forms to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function role<R extends boolean>({
	required,
	displayName = 'Role',
	description = 'Workspace role: admin, user (can edit forms) or readonly.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Admin', value: 'admin' },
				{ label: 'User', value: 'user' },
				{ label: 'Read-only', value: 'readonly' },
			],
		},
	});
}

function page<R extends boolean>({
	required,
	displayName = 'Page',
	description = 'Page number, starting at 1. Defaults to 1.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function perPage<R extends boolean>({
	required,
	displayName = 'Per Page',
	description = 'Items per page (1-100). Defaults to 10.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

export const opnformAiProps = { workspaceId, formId, formSlug, role, page, perPage };
