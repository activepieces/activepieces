import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from './request';

export const listUId = Property.Dropdown({
	displayName: 'List',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first.',
				options: [],
			};
		}

		const response = await zagoMailApiService.getAllLists(auth as string);

		const lists = response.data as {
			records: Array<{ general: { list_uid: string; name: string } }>;
		};

		return {
			disabled: false,
			options: lists.records.map((list) => ({
				label: list.general.name,
				value: list.general.list_uid,
			})),
		};
	},
});

export const campaignUid = Property.Dropdown({
	displayName: 'Campaign',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first.',
				options: [],
			};
		}

		const response = await zagoMailApiService.getCampaigns(auth as string);

		const campaigns = response as {
			records: Array<{ campaign_uid: string; name: string }>;
		};

		return {
			disabled: false,
			options: campaigns.records.map((campaign) => ({
				label: campaign.name,
				value: campaign.campaign_uid,
			})),
		};
	},
});

export const listFields = (isCreate=false) => Property.DynamicProperties({
	displayName: 'List Fields',
	refreshers: ['listUId'],
	required: true,
	props: async ({ auth, listUId }) => {
		if (!auth || !listUId) return {};

		const fields: DynamicPropsValue = {};

		const response = await zagoMailApiService.getListFields(
			auth as unknown as string,
			listUId as unknown as string,
		);

		const customFields = response as {
			records: { tag: string; label: string; required: string; type: { name: string } }[];
		};

		for (const field of customFields.records) {
			switch (field.type.name) {
				case 'Text':
				case 'Country':
				case 'State':
					fields[`${field.tag}:::${field.type.name}`] = Property.ShortText({
						displayName: field.label,
						required: field.required === 'yes' && isCreate,
					});
					break;
				case 'Date':
				case 'Datetime':
					fields[`${field.tag}:::${field.type.name}`] = Property.DateTime({
						displayName: field.label,
						required: field.required === 'yes' && isCreate,
					});
					break;
				case 'Textarea':
					fields[`${field.tag}:::${field.type.name}`] = Property.LongText({
						displayName: field.label,
						required: field.required === 'yes' && isCreate,
					});
					break;
				case 'Checkbox':
					fields[`${field.tag}:::${field.type.name}`] = Property.StaticDropdown({
						displayName: field.label,
						required: field.required === 'yes' && isCreate,
						options: {
							disabled: false,
							options: [
								{ label: 'Yes', value: '1' },
								{ label: 'No', value: '0' },
							],
						},
					});
					break;
			}
		}
		return fields;
	},
});
