import { DropdownState, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../auth';
import { senderApi } from './api';

function groupId<R extends boolean>({
	required,
	displayName = 'Groups',
	description = 'Select one or more groups',
}: PropParams<R>) {
	return Property.Dropdown<string, R, typeof senderAuth>({
		auth: senderAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			try {
				const { data: groups = [] } = await senderApi.listGroups({ auth });
				return {
					disabled: false,
					options: groups.map((group) => ({ label: group.title, value: group.id })),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Error loading groups' });
			}
		},
	});
}

function groupIds<R extends boolean>({
	required,
	displayName = 'Groups',
	description = 'Select one or more groups',
}: PropParams<R>) {
	return Property.MultiSelectDropdown<string, R, typeof senderAuth>({
		auth: senderAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			try {
				const { data: groups = [] } = await senderApi.listGroups({ auth });
				return {
					disabled: false,
					options: groups.map((group) => ({ label: group.title, value: group.id })),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Error loading groups' });
			}
		},
	});
}

function subscriber<R extends boolean>({
	required,
	displayName = 'Subscriber',
	description = 'Select a subscriber',
}: PropParams<R>) {
	return Property.Dropdown<string, R, typeof senderAuth>({
		auth: senderAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			try {
				const { data: subscribers = [] } = await senderApi.listSubscribers({ auth, limit: 50 });
				return {
					disabled: false,
					options: subscribers.map((sub) => ({ label: sub.email, value: sub.email })),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Error loading subscribers' });
			}
		},
	});
}

function subscribers<R extends boolean>({
	required,
	displayName = 'Subscribers',
	description = 'Select one or more subscribers to delete',
}: PropParams<R>) {
	return Property.MultiSelectDropdown<string, R, typeof senderAuth>({
		auth: senderAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			try {
				const { data: subscribers = [] } = await senderApi.listSubscribers({ auth, limit: 50 });
				return {
					disabled: false,
					options: subscribers.map((sub) => ({ label: sub.email, value: sub.email })),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Error loading subscribers' });
			}
		},
	});
}

function campaignId<R extends boolean>({
	required,
	displayName = 'Campaign',
	description = 'Select a campaign',
}: PropParams<R>) {
	return Property.Dropdown<string, R, typeof senderAuth>({
		auth: senderAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			try {
				const { data: campaigns = [] } = await senderApi.listCampaigns({
					auth,
					limit: 50,
					status: 'DRAFT',
				});
				return {
					disabled: false,
					options: campaigns.map((c) => ({ label: c.title || c.subject || c.id, value: c.id })),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Error loading campaigns' });
			}
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const senderProps = { groupId, groupIds, subscriber, subscribers, campaignId };

const NOT_CONNECTED = 'Please connect your Sender account first';

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
