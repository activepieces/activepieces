import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';

import { mauticAuth } from '../auth';
import { mauticApi } from './api';

import type { MauticEntityFieldType, MauticFieldOption } from './types';

function contactFields<R extends boolean>(params: PropParams<R>) {
	return entityFields({ ...params, type: 'lead' });
}

function companyFields<R extends boolean>(params: PropParams<R>) {
	return entityFields({ ...params, type: 'company' });
}

function entityId<R extends boolean>({
	required,
	displayName = 'Id of the entity',
	description,
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function webhookName<R extends boolean>({
	required,
	displayName = 'Webhook Name',
	description = 'The name the webhook will be searchable by in mautic the webhooks page.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function webhookDescription<R extends boolean>({
	required,
	displayName = 'Description',
	description = 'A short description of the webhook',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function entityFields<R extends boolean>({
	required,
	type,
	displayName = 'All Fields',
	description = 'List of all possible fields present',
}: PropParams<R> & { type: MauticEntityFieldType }) {
	return Property.DynamicProperties({
		auth: mauticAuth,
		displayName,
		description,
		required,
		refreshers: [],
		props: async ({ auth }) => {
			if (!auth) return {};
			const fieldList = await mauticApi.listFields({ auth, type });
			return fieldList.reduce((fields: DynamicPropsValue, field) => {
				const { label: displayName, alias, type, properties } = field;
				const fieldMetadata = {
					displayName,
					required: false,
				};
				if (!type) return {};
				const f = mapMauticToActivepiecesProperty({ type, fieldMetadata, properties });
				if (f) {
					fields[alias] = f;
				}
				return fields;
			}, {});
		},
	});
}

function mapMauticToActivepiecesProperty({
	type,
	fieldMetadata,
	properties,
}: {
	type: string;
	fieldMetadata: { displayName: string; required: boolean };
	properties: Record<string, MauticFieldOption[]>;
}) {
	switch (type) {
		case 'lookup':
		case 'text':
		case 'email':
		case 'tel':
		case 'region':
		case 'country':
		case 'locale':
		case 'timezone':
		case 'url':
			return Property.ShortText(fieldMetadata);
		case 'date':
		case 'datetime':
			return Property.DateTime(fieldMetadata);
		case 'number':
			return Property.Number(fieldMetadata);
		case 'boolean':
			return Property.StaticDropdown({
				...fieldMetadata,
				options: {
					options: [
						{ value: 'no', label: 'No' },
						{ value: 'yes', label: 'Yes' },
					],
				},
			});
		case 'multiselect':
			return Property.StaticMultiSelectDropdown({
				...fieldMetadata,
				options: {
					options: Object.values(properties)[0],
				},
			});
		case 'select':
			return Property.StaticDropdown({
				...fieldMetadata,
				options: {
					options: Object.values(properties)[0],
				},
			});
		default:
			return null;
	}
}

export const mauticProps = {
	contactFields,
	companyFields,
	entityId,
	webhookName,
	webhookDescription,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
