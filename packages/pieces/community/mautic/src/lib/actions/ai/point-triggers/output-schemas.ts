import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields, triggerFields } from '../../../output-schemas';

export const mauticCreatePointTriggerOutputSchema: OutputSchema = {
	fields: [{ key: 'trigger', label: 'Trigger', children: triggerFields }],
};

export const mauticDeletePointTriggerEventsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'trigger',
			label: 'Trigger',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{
					key: 'category',
					label: 'Category',
					children: [
						{ key: 'isPublished', label: 'Published', format: 'boolean' },
						{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
						{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'title', label: 'Title' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'description', label: 'Description' },
						{ key: 'color', label: 'Color' },
						{ key: 'bundle', label: 'Bundle' },
					],
				},
				{ key: 'description', label: 'Description' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'color', label: 'Color' },
				{
					key: 'events',
					label: 'Events',
					labelKey: 'name',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'type', label: 'Type' },
						{ key: 'order', label: 'Order', format: 'number' },
						{
							key: 'properties',
							label: 'Properties',
							children: [
								{ key: 'add_tags', label: 'Add Tags' },
								{ key: 'remove_tags', label: 'Remove Tags' },
							],
						},
					],
				},
				{ key: 'triggerExistingLeads', label: 'Trigger Existing Leads', format: 'boolean' },
			],
		},
	],
};

export const mauticDeletePointTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'trigger',
			label: 'Trigger',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'color', label: 'Color' },
				{
					key: 'events',
					label: 'Events',
					labelKey: 'name',
					listItems: [
						{ key: 'id', label: 'ID' },
						{ key: 'name', label: 'Name' },
						{ key: 'description', label: 'Description' },
						{ key: 'type', label: 'Type' },
						{ key: 'order', label: 'Order', format: 'number' },
						{
							key: 'properties',
							label: 'Properties',
							children: [
								{ key: 'add_tags', label: 'Add Tags' },
								{ key: 'remove_tags', label: 'Remove Tags' },
							],
						},
					],
				},
				{ key: 'triggerExistingLeads', label: 'Trigger Existing Leads', format: 'boolean' },
			],
		},
	],
};

export const mauticListPointTriggerEventTypesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'eventTypes',
			label: 'Event Types',
			children: [
				{
					key: 'campaign.changecampaign',
					label: 'Campaign Changecampaign',
					value: "['campaign.changecampaign']",
				},
				{ key: 'lead.changelists', label: 'Lead Changelists', value: "['lead.changelists']" },
				{ key: 'lead.changetags', label: 'Lead Changetags', value: "['lead.changetags']" },
				{ key: 'plugin.leadpush', label: 'Plugin Leadpush', value: "['plugin.leadpush']" },
				{ key: 'email.send', label: 'Email Send', value: "['email.send']" },
				{ key: 'email.send_to_user', label: 'Email Send To User', value: "['email.send_to_user']" },
			],
		},
	],
};

export const mauticListPointTriggersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'triggers', label: 'Triggers', labelKey: 'name', listItems: triggerFields },
	],
};
