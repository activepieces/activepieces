import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields, messageChannelsFields } from '../../../output-schemas';

export const mauticCreateMarketingMessageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'message',
			label: 'Message',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'channels', label: 'Channels', labelKey: 'id', listItems: messageChannelsFields },
				{ key: 'category', label: 'Category', children: categoryFields },
			],
		},
	],
};

export const mauticDeleteMarketingMessageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'message',
			label: 'Message',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down' },
				{
					key: 'channels',
					label: 'Channels',
					listItems: [
						{ key: 'id', label: 'ID' },
						{ key: 'channel', label: 'Channel' },
						{ key: 'channelId', label: 'Channel ID', format: 'number' },
						{ key: 'channelName', label: 'Channel Name' },
						{ key: 'isEnabled', label: 'Is Enabled', format: 'boolean' },
					],
				},
				{ key: 'category', label: 'Category', children: categoryFields },
			],
		},
	],
};

export const mauticGetMarketingMessageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'message',
			label: 'Message',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'channels', label: 'Channels', labelKey: 'id', listItems: messageChannelsFields },
				{ key: 'category', label: 'Category', children: categoryFields },
			],
		},
	],
};

export const mauticListMarketingMessagesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'messages',
			label: 'Messages',
			labelKey: 'name',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'channels', label: 'Channels', labelKey: 'id', listItems: messageChannelsFields },
				{ key: 'category', label: 'Category', children: categoryFields },
			],
		},
	],
};
