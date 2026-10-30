import { OutputSchema } from '@activepieces/pieces-framework';

import {
	categoryFields,
	dynamicContentUtmTagsFields,
	notificationFields,
} from '../../../output-schemas';

export const mauticCreatePushNotificationOutputSchema: OutputSchema = {
	fields: [{ key: 'notification', label: 'Notification', children: notificationFields }],
};

export const mauticDeletePushNotificationOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'notification',
			label: 'Notification',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'heading', label: 'Heading' },
				{ key: 'message', label: 'Message' },
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'button', label: 'Button' },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'readCount', label: 'Read Count', format: 'number' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
			],
		},
	],
};

export const mauticGetPushNotificationOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'notification',
			label: 'Notification',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'heading', label: 'Heading' },
				{ key: 'message', label: 'Message' },
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'button', label: 'Button' },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'readCount', label: 'Read Count', format: 'number' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
			],
		},
	],
};

export const mauticListPushNotificationsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'notifications',
			label: 'Notifications',
			labelKey: 'name',
			listItems: notificationFields,
		},
	],
};
