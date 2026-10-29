import { DropdownState, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from './api';

function campaignKey<R extends boolean>({
	required,
	displayName = 'Campaign',
	description = 'Select the campaign',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoCampaignsAuth,
		displayName,
		description,
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			const campaigns = await zohoCampaignsApi.listCampaigns({ auth });
			if (campaigns.length === 0) {
				return disabledOptions({ placeholder: 'No campaigns found' });
			}
			return {
				options: campaigns.map((campaign) => ({
					label: campaign.campaign_name,
					value: campaign.campaign_key,
				})),
			};
		},
	});
}

function tagName<R extends boolean>({
	required,
	displayName = 'Tag',
	description = 'Select the tag to associate with the contact',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoCampaignsAuth,
		displayName,
		description,
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			const tags = await zohoCampaignsApi.listTags({ auth });
			if (!tags || tags.length === 0) {
				return disabledOptions({ placeholder: 'No tags found' });
			}
			return {
				options: tags.flatMap((tagMap) =>
					Object.values(tagMap).map((tag) => ({
						label: tag.tag_name,
						value: tag.tag_name,
					})),
				),
			};
		},
	});
}

function listKey<R extends boolean>({
	required,
	displayName = 'Mailing List',
	description = 'Select the mailing list',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoCampaignsAuth,
		displayName,
		description,
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			const mailingLists = await zohoCampaignsApi.listMailingLists({ auth });
			if (mailingLists.length === 0) {
				return disabledOptions({ placeholder: 'No mailing lists found' });
			}
			return {
				options: mailingLists.map((list) => ({
					label: list.listname,
					value: list.listkey,
				})),
			};
		},
	});
}

function listKeys<R extends boolean>({
	required,
	displayName = 'Mailing Lists',
	description = 'Select the mailing lists',
}: PropParams<R>) {
	return Property.MultiSelectDropdown({
		auth: zohoCampaignsAuth,
		displayName,
		description,
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			const mailingLists = await zohoCampaignsApi.listMailingLists({ auth });
			if (mailingLists.length === 0) {
				return disabledOptions({ placeholder: 'No mailing lists found' });
			}
			return {
				options: mailingLists.map((list) => ({
					label: list.listname,
					value: list.listkey,
				})),
			};
		},
	});
}

function topicId<R extends boolean>({
	required,
	displayName = 'Topic',
	description = 'Select the topic',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoCampaignsAuth,
		displayName,
		description,
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: NOT_CONNECTED });
			}
			const topics = await zohoCampaignsApi.listTopics({ auth });
			if (topics.length === 0) {
				return disabledOptions({ placeholder: 'No topics found' });
			}
			return {
				options: topics.map((topic) => ({
					label: topic.topicName,
					value: topic.topicId,
				})),
			};
		},
	});
}

function contactInfo<R extends boolean>({
	required,
	displayName = 'Contact Information',
	description = 'Information about the contact',
}: PropParams<R>) {
	return Property.DynamicProperties({
		auth: zohoCampaignsAuth,
		displayName,
		description,
		required,
		refreshers: ['auth'],
		props: async () => ({
			'Contact Email': Property.ShortText({
				displayName: 'Contact Email',
				description: 'Email address of the contact',
				required: true,
			}),
			'First Name': Property.ShortText({
				displayName: 'First Name',
				description: 'First name of the contact',
				required: false,
			}),
			'Last Name': Property.ShortText({
				displayName: 'Last Name',
				description: 'Last name of the contact',
				required: false,
			}),
			Phone: Property.ShortText({
				displayName: 'Phone',
				description: 'Phone number of the contact',
				required: false,
			}),
			'Company Name': Property.ShortText({
				displayName: 'Company Name',
				description: 'Company name of the contact',
				required: false,
			}),
			additionalFields: Property.Object({
				displayName: 'Additional Fields',
				description:
					'Additional fields for the contact in key-value pairs. For example, {"City": "New York", "State": "NY"}',
				required: false,
			}),
		}),
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const zohoCampaignsProps = {
	campaignKey,
	tagName,
	listKey,
	listKeys,
	topicId,
	contactInfo,
};

const NOT_CONNECTED = 'Connect your Zoho Campaigns account first';

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
