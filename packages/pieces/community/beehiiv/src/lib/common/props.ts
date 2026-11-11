import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { apiKeyOf, beehiivClient, pathFor, vendorMessage } from './client';
import { beehiivAuth } from './auth';

export const publicationId = Property.Dropdown({
	auth: beehiivAuth,
	displayName: 'Publication',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return disabledState({ placeholder: 'Please connect your beehiiv account first.' });
		}
		try {
			const publications = await beehiivClient.listAllPaged<NamedRecord>({
				apiKey: apiKeyOf(auth),
				path: '/publications',
				operation: 'list publications',
				maxItems: DROPDOWN_MAX_ITEMS,
			});
			return {
				disabled: false,
				options: publications.map((publication) => ({ label: publication.name, value: publication.id })),
			};
		} catch (error) {
			return disabledState({ placeholder: loadFailedText({ what: 'publications', error }) });
		}
	},
});

export const subscriptionId = (isRequired = false) =>
	Property.Dropdown({
		auth: beehiivAuth,
		displayName: 'Subscription ID',
		description: 'Shows the 100 newest subscribers. Type an exact email address to find any other subscriber.',
		refreshers: ['publicationId'],
		refreshOnSearch: true,
		required: isRequired,
		options: async ({ auth, publicationId }, { searchValue }) => {
			if (!auth) {
				return disabledState({ placeholder: 'Please connect your beehiiv account first.' });
			}
			if (typeof publicationId !== 'string' || publicationId === '') {
				return disabledState({ placeholder: 'Select a publication first.' });
			}
			const search = typeof searchValue === 'string' ? searchValue.trim() : '';
			try {
				const page = await beehiivClient.listCursorPage<SubscriptionRecord>({
					apiKey: apiKeyOf(auth),
					path: `${pathFor(['publications', publicationId])}/subscriptions`,
					operation: 'list subscriptions',
					query: search === '' ? { order_by: 'created', direction: 'desc' } : { email: search },
					limit: SUBSCRIPTION_DROPDOWN_LIMIT,
				});
				const options = page.items.map((subscription) => ({ label: subscription.email, value: subscription.id }));
				return {
					disabled: false,
					placeholder: search === '' ? 'Type an exact email to find others' : options.length === 0 ? 'No subscriber has this exact email' : undefined,
					options,
				};
			} catch (error) {
				return disabledState({ placeholder: loadFailedText({ what: 'subscriptions', error }) });
			}
		},
	});

export const automationId = ({
	displayName,
	description,
	required = false,
	singleSelect = true,
}: {
	displayName: string;
	description: string;
	required?: boolean;
	singleSelect?: boolean;
}) => {
	const fieldType = singleSelect
		? Property.Dropdown<string, boolean, typeof beehiivAuth>
		: Property.MultiSelectDropdown<string, boolean, typeof beehiivAuth>;
	return fieldType({
		auth: beehiivAuth,
		displayName,
		description,
		refreshers: ['publicationId'],
		required,
		options: async ({ auth, publicationId }) => {
			if (!auth) {
				return disabledState({ placeholder: 'Please connect your beehiiv account first.' });
			}
			if (typeof publicationId !== 'string' || publicationId === '') {
				return disabledState({ placeholder: 'Select a publication first.' });
			}
			try {
				const automations = await beehiivClient.listAllPaged<AutomationRecord>({
					apiKey: apiKeyOf(auth),
					path: `${pathFor(['publications', publicationId])}/automations`,
					operation: 'list automations',
					maxItems: DROPDOWN_MAX_ITEMS,
				});
				return {
					disabled: false,
					options: automations
						.filter((automation) => automation.status !== 'inactive')
						.map((automation) => ({ label: automation.name, value: automation.id })),
				};
			} catch (error) {
				return disabledState({ placeholder: loadFailedText({ what: 'automations', error }) });
			}
		},
	});
};

export const customFields = Property.DynamicProperties({
	auth: beehiivAuth,
	displayName: 'Custom Fields',
	refreshers: ['publicationId'],
	required: false,
	props: async ({ auth, publicationId }) => {
		if (!auth || typeof publicationId !== 'string' || publicationId === '') {
			return {};
		}
		const fields: DynamicPropsValue = {};
		try {
			const definitions = await beehiivClient.listAllPaged<CustomFieldRecord>({
				apiKey: apiKeyOf(auth),
				path: `${pathFor(['publications', publicationId])}/custom_fields`,
				operation: 'list custom fields',
				maxItems: DROPDOWN_MAX_ITEMS,
			});
			for (const field of definitions) {
				switch (field.kind) {
					case 'string':
						fields[field.display] = Property.ShortText({ displayName: field.display, required: false });
						break;
					case 'integer':
					case 'double':
						fields[field.display] = Property.Number({ displayName: field.display, required: false });
						break;
					case 'boolean':
						fields[field.display] = Property.StaticDropdown<boolean>({
							displayName: field.display,
							description: 'Leave empty to keep the current value.',
							required: false,
							options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
						});
						break;
					case 'date':
					case 'datetime':
						fields[field.display] = Property.DateTime({ displayName: field.display, required: false });
						break;
					case 'list':
						fields[field.display] = Property.Array({ displayName: field.display, required: false });
						break;
					default:
						break;
				}
			}
		} catch (error) {
			fields['custom_fields_error'] = Property.MarkDown({ value: loadFailedText({ what: 'custom fields', error }) });
		}
		return fields;
	},
});

function disabledState({ placeholder }: { placeholder: string }) {
	return { disabled: true, options: [], placeholder };
}

function loadFailedText({ what, error }: { what: string; error: unknown }): string {
	const detail = error instanceof Error ? error.message : vendorMessage(error);
	return `Could not load ${what}: ${detail}`.slice(0, 300);
}

const DROPDOWN_MAX_ITEMS = 10_000;
const SUBSCRIPTION_DROPDOWN_LIMIT = 100;

type NamedRecord = { id: string; name: string };

type SubscriptionRecord = { id: string; email: string };

type AutomationRecord = { id: string; name: string; status: string };

type CustomFieldRecord = { id: string; kind: string; display: string };
