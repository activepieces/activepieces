import { DropdownOption, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaApi } from './api';

function campaignDropdown({ description }: { description: string }) {
	return Property.Dropdown({
		auth: emeliaAuth,
		displayName: 'Campaign',
		description,
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return { disabled: true, placeholder: 'Connect your Emelia account first.', options: [] };
			}
			try {
				const campaigns = await emeliaApi.listCampaigns({ apiKey: auth.secret_text });
				if (campaigns.length === 0) {
					return { disabled: true, placeholder: 'No campaigns found. Create a campaign in Emelia first.', options: [] };
				}
				return {
					disabled: false,
					options: campaigns.map((campaign) => ({
						label: `${campaign.name} (${campaignStatusLabel(campaign.status)})`,
						value: campaign._id,
					})),
				};
			} catch {
				return { disabled: true, placeholder: 'Could not load campaigns. Check your connection.', options: [] };
			}
		},
	});
}

function listDropdown({ description }: { description: string }) {
	return Property.Dropdown({
		auth: emeliaAuth,
		displayName: 'Contact List',
		description,
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return { disabled: true, placeholder: 'Connect your Emelia account first.', options: [] };
			}
			try {
				const lists = await emeliaApi.listAllLists({ apiKey: auth.secret_text });
				if (lists.length === 0) {
					return { disabled: true, placeholder: 'No contact lists found. Create a list in Emelia first.', options: [] };
				}
				const options: DropdownOption<string>[] = lists.map((list) => ({
					label: typeof list.numberOfContacts === 'number' ? `${list.name} (${list.numberOfContacts} contacts)` : list.name,
					value: list._id,
				}));
				return { disabled: false, options };
			} catch {
				return { disabled: true, placeholder: 'Could not load contact lists. Check your connection.', options: [] };
			}
		},
	});
}

function campaignStatusLabel(status: string | undefined): string {
	switch (status) {
		case 'DRAFT':
			return 'Draft';
		case 'RUNNING':
			return 'Running';
		case 'PAUSED':
			return 'Paused';
		case 'FINISHED':
			return 'Finished';
		case 'ARCHIVED':
			return 'Archived';
		default:
			return status ?? 'Unknown';
	}
}

export const emeliaProps = {
	campaignDropdown,
	listDropdown,
};
