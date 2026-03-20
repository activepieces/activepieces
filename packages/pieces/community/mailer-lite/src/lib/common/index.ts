import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import MailerLite from '@mailerlite/mailerlite-nodejs';
import { mailerLiteAuth } from '../..';

export const mailerLiteCommon = {
	subscriberFields: Property.DynamicProperties({
		auth: mailerLiteAuth,
		displayName: 'Fields',
		refreshers: [],
		required: true,
		props: async ({ auth }) => {
			if (!auth) return {};

			const props: DynamicPropsValue = {};

			const client = new MailerLite({ api_key: auth.secret_text });
			const response = await client.fields.get({ page: 1, limit: 100 });

			for (const field of response.data.data) {
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
			displayName: 'Group IDs',
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

				const client = new MailerLite({ api_key: auth.secret_text });
				const response = await client.groups.get({
					page: 1,
					limit: 100,
					sort: '-created_at',
				});

				return {
					disabled: false,
					options: response.data.data.map((group) => {
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
			displayName: 'Group ID',
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

				const client = new MailerLite({ api_key: auth.secret_text });
				const response = await client.groups.get({
					page: 1,
					limit: 100,
					sort: '-created_at',
				});

				return {
					disabled: false,
					options: response.data.data.map((group) => {
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
			displayName: 'Subscriber ID',
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
				let cursor;
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
					cursor = response.data.meta.next_cursor;
				} while (cursor !== null);
				return {
					disabled: false,
					options: subscribers,
				};
			},
		}),
};
