import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import MailerLite from '@mailerlite/mailerlite-nodejs';
import { mailerLiteAuth } from '../auth';

export const mailerLiteCommon = {
	subscriberFields: Property.DynamicProperties({
		auth: mailerLiteAuth,
		displayName: 'Custom Fields',
		refreshers: [],
		required: true,
		props: async ({ auth }) => {
			if (!auth) return {};

			const props: DynamicPropsValue = {};

			const fields = await listAllFields({ apiKey: auth.secret_text });

			for (const field of fields) {
				switch (field.type) {
					case 'number':
						props[field.key] = Property.Number({
							displayName: field.name,
							required: false,
						});
						break;
					case 'text':
						props[field.key] = Property.LongText({
							displayName: field.name,
							required: false,
						});
						break;
					case 'date':
						props[field.key] = Property.DateTime({
							displayName: field.name,
							required: false,
							description: 'Provide YYYY-MM-DD format.',
						});
						break;
				}
			}
			return props;
		},
	}),
	subscriberGroupIds: (required = false) =>
		Property.MultiSelectDropdown({
			auth: mailerLiteAuth,
			displayName: 'Groups',
			description: 'Adds the subscriber to these groups.',
			required,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}

				const groups = await listAllGroups({ apiKey: auth.secret_text });

				return {
					disabled: false,
					options: groups.map((group) => {
						return {
							label: group.name,
							value: group.id,
						};
					}),
				};
			},
		}),
	subscriberGroupId: (required = false) =>
		Property.Dropdown({
			auth: mailerLiteAuth,
			displayName: 'Group',
			required,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}

				const groups = await listAllGroups({ apiKey: auth.secret_text });

				return {
					disabled: false,
					options: groups.map((group) => {
						return {
							label: group.name,
							value: group.id,
						};
					}),
				};
			},
		}),
	subscriberId: (required = false) =>
		Property.Dropdown({
			auth: mailerLiteAuth,
			displayName: 'Subscriber',
			refreshers: [],
			required,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const client = new MailerLite({ api_key: auth.secret_text });
				const subscribers: { label: string; value: string }[] = [];
				let cursor: string | undefined = undefined;
				do {
					const response = await client.subscribers.get({
						limit: 25,
						cursor: cursor,
					});
					subscribers.push(
						...response.data.data.map((subscriber) => ({
							label: subscriber.email,
							value: subscriber.id,
						})),
					);
					cursor = response.data.meta.next_cursor || undefined;
				} while (cursor);
				return {
					disabled: false,
					options: subscribers,
				};
			},
		}),
};

async function listAllGroups({ apiKey }: { apiKey: string }): Promise<MailerLiteGroup[]> {
	const client = new MailerLite({ api_key: apiKey });
	const groups: MailerLiteGroup[] = [];
	let page = 1;
	let lastPage = 1;
	do {
		const response = await client.groups.get({
			page,
			limit: 100,
			sort: '-created_at',
		});
		groups.push(
			...response.data.data.map((group) => ({
				id: group.id,
				name: group.name,
			})),
		);
		lastPage = response.data.meta.last_page;
		page++;
	} while (page <= lastPage);
	return groups;
}

async function listAllFields({ apiKey }: { apiKey: string }): Promise<MailerLiteField[]> {
	const client = new MailerLite({ api_key: apiKey });
	const fields: MailerLiteField[] = [];
	let page = 1;
	let lastPage = 1;
	do {
		const response = await client.fields.get({ page, limit: 100 });
		fields.push(
			...response.data.data.map((field) => ({
				key: field.key,
				name: field.name,
				type: field.type,
			})),
		);
		lastPage = response.data.meta.last_page;
		page++;
	} while (page <= lastPage);
	return fields;
}

type MailerLiteGroup = {
	id: string;
	name: string;
};

type MailerLiteField = {
	key: string;
	name: string;
	type: string;
};
