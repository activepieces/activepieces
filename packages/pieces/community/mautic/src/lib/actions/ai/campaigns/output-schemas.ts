import { OutputSchema } from '@activepieces/pieces-framework';

import {
	campaign2Fields,
	campaignEventsFields,
	campaignFields,
	campaignListsFields,
	categoryFields,
	eventFields,
} from '../../../output-schemas';

export const mauticAdjustContactPointsOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'number' }],
};

export const mauticBatchRescheduleContactCampaignEventsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'events', label: 'Events', dynamicKey: true, labelKey: 'name' },
		{
			key: 'errors',
			label: 'Errors',
			listItems: [
				{ key: 'code', label: 'Code', format: 'number' },
				{ key: 'message', label: 'Message' },
				{ key: 'details', label: 'Details' },
				{ key: 'type', label: 'Type' },
			],
		},
	],
};

export const mauticCloneCampaignOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'campaign',
			label: 'Campaign',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'allowRestart', label: 'Allow Restart', format: 'boolean' },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down', format: 'datetime' },
				{ key: 'events', label: 'Events' },
				{ key: 'forms', label: 'Forms' },
				{ key: 'lists', label: 'Lists' },
				{
					key: 'canvasSettings',
					label: 'Canvas Settings',
					children: [
						{
							key: 'nodes',
							label: 'Nodes',
							labelKey: 'id',
							listItems: [
								{ key: 'id', label: 'ID' },
								{ key: 'positionX', label: 'Position X' },
								{ key: 'positionY', label: 'Position Y' },
							],
						},
						{
							key: 'connections',
							label: 'Connections',
							listItems: [
								{
									key: 'anchors',
									label: 'Anchors',
									children: [
										{ key: 'source', label: 'Source' },
										{ key: 'target', label: 'Target' },
									],
								},
								{ key: 'sourceId', label: 'Source ID' },
								{ key: 'targetId', label: 'Target ID' },
							],
						},
					],
				},
			],
		},
	],
};

export const mauticCreateCampaignOutputSchema: OutputSchema = {
	fields: [{ key: 'campaign', label: 'Campaign', children: campaignFields }],
};

export const mauticDeleteCampaignOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'campaign',
			label: 'Campaign',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'allowRestart', label: 'Allow Restart', format: 'boolean' },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down', format: 'datetime' },
				{ key: 'events', label: 'Events' },
				{ key: 'forms', label: 'Forms' },
				{ key: 'lists', label: 'Lists' },
				{
					key: 'canvasSettings',
					label: 'Canvas Settings',
					children: [
						{
							key: 'nodes',
							label: 'Nodes',
							labelKey: 'id',
							listItems: [
								{ key: 'id', label: 'ID' },
								{ key: 'positionX', label: 'Position X' },
								{ key: 'positionY', label: 'Position Y' },
							],
						},
						{
							key: 'connections',
							label: 'Connections',
							listItems: [
								{
									key: 'anchors',
									label: 'Anchors',
									children: [
										{ key: 'source', label: 'Source' },
										{ key: 'target', label: 'Target' },
									],
								},
								{ key: 'sourceId', label: 'Source ID' },
								{ key: 'targetId', label: 'Target ID' },
							],
						},
					],
				},
			],
		},
	],
};

export const mauticGetCampaignEventOutputSchema: OutputSchema = {
	fields: [{ key: 'event', label: 'Event', children: eventFields }],
};

export const mauticGetCampaignOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'campaign',
			label: 'Campaign',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'allowRestart', label: 'Allow Restart', format: 'boolean' },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down', format: 'datetime' },
				{ key: 'events', label: 'Events', labelKey: 'name', listItems: campaignEventsFields },
				{ key: 'forms', label: 'Forms' },
				{ key: 'lists', label: 'Lists', labelKey: 'name', listItems: campaignListsFields },
				{
					key: 'canvasSettings',
					label: 'Canvas Settings',
					children: [
						{
							key: 'nodes',
							label: 'Nodes',
							labelKey: 'id',
							listItems: [
								{ key: 'id', label: 'ID' },
								{ key: 'positionX', label: 'Position X' },
								{ key: 'positionY', label: 'Position Y' },
							],
						},
						{
							key: 'connections',
							label: 'Connections',
							listItems: [
								{
									key: 'anchors',
									label: 'Anchors',
									children: [
										{ key: 'source', label: 'Source' },
										{ key: 'target', label: 'Target' },
									],
								},
								{ key: 'sourceId', label: 'Source ID' },
								{ key: 'targetId', label: 'Target ID' },
							],
						},
					],
				},
			],
		},
	],
};

export const mauticListCampaignContactEventsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'events',
			label: 'Events',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'type', label: 'Type' },
				{ key: 'eventType', label: 'Event Type' },
				{ key: 'channel', label: 'Channel' },
				{ key: 'channelId', label: 'Channel ID' },
				{ key: 'order', label: 'Order', format: 'number' },
				{ key: 'triggerDate', label: 'Trigger Date' },
				{ key: 'triggerInterval', label: 'Trigger Interval', format: 'number' },
				{ key: 'triggerIntervalUnit', label: 'Trigger Interval Unit' },
				{ key: 'triggerHour', label: 'Trigger Hour' },
				{ key: 'triggerRestrictedStartHour', label: 'Trigger Restricted Start Hour' },
				{ key: 'triggerRestrictedStopHour', label: 'Trigger Restricted Stop Hour' },
				{ key: 'triggerRestrictedDaysOfWeek', label: 'Trigger Restricted Days Of Week' },
				{ key: 'triggerMode', label: 'Trigger Mode' },
				{ key: 'decisionPath', label: 'Decision Path' },
				{ key: 'parent', label: 'Parent' },
				{ key: 'contactLog', label: 'Contact Log' },
			],
		},
		{ key: 'campaign', label: 'Campaign', children: campaign2Fields },
		{
			key: 'membership',
			label: 'Membership',
			listItems: [
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'manuallyRemoved', label: 'Manually Removed', format: 'boolean' },
				{ key: 'manuallyAdded', label: 'Manually Added', format: 'boolean' },
				{ key: 'rotation', label: 'Rotation', format: 'number' },
				{ key: 'dateLastExited', label: 'Date Last Exited' },
			],
		},
	],
};

export const mauticListCampaignContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total' },
		{
			key: 'contacts',
			label: 'Contacts',
			listItems: [
				{ key: 'campaign_id', label: 'Campaign ID' },
				{ key: 'lead_id', label: 'Lead ID' },
				{ key: 'date_added', label: 'Date Added', format: 'datetime' },
				{ key: 'manually_removed', label: 'Manually Removed' },
				{ key: 'manually_added', label: 'Manually Added' },
				{ key: 'rotation', label: 'Rotation' },
			],
		},
	],
};

export const mauticListCampaignEventsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'events', label: 'Events', labelKey: 'name', listItems: eventFields },
	],
};

export const mauticListCampaignsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'campaigns', label: 'Campaigns', labelKey: 'name', listItems: campaignFields },
	],
};

export const mauticListContactCampaignEventsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'events', label: 'Events' },
	],
};

export const mauticRescheduleContactCampaignEventOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'event',
			label: 'Event',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'type', label: 'Type' },
				{ key: 'eventType', label: 'Event Type' },
				{ key: 'channel', label: 'Channel' },
				{ key: 'channelId', label: 'Channel ID' },
				{ key: 'order', label: 'Order', format: 'number' },
				{ key: 'triggerDate', label: 'Trigger Date' },
				{ key: 'triggerInterval', label: 'Trigger Interval', format: 'number' },
				{ key: 'triggerIntervalUnit', label: 'Trigger Interval Unit' },
				{ key: 'triggerHour', label: 'Trigger Hour' },
				{ key: 'triggerRestrictedStartHour', label: 'Trigger Restricted Start Hour' },
				{ key: 'triggerRestrictedStopHour', label: 'Trigger Restricted Stop Hour' },
				{ key: 'triggerRestrictedDaysOfWeek', label: 'Trigger Restricted Days Of Week' },
				{ key: 'triggerMode', label: 'Trigger Mode' },
				{ key: 'decisionPath', label: 'Decision Path' },
				{ key: 'parent', label: 'Parent' },
				{
					key: 'campaign',
					label: 'Campaign',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'category', label: 'Category' },
						{ key: 'description', label: 'Description' },
						{ key: 'allowRestart', label: 'Allow Restart', format: 'boolean' },
						{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
						{ key: 'publishDown', label: 'Publish Down', format: 'datetime' },
						{ key: 'events', label: 'Events' },
						{ key: 'deleted', label: 'Deleted' },
					],
				},
				{
					key: 'contactLog',
					label: 'Contact Log',
					listItems: [
						{ key: 'ipAddress', label: 'IP Address' },
						{ key: 'dateTriggered', label: 'Date Triggered', format: 'datetime' },
						{ key: 'isScheduled', label: 'Is Scheduled', format: 'boolean' },
						{ key: 'triggerDate', label: 'Trigger Date', format: 'datetime' },
						{ key: 'metadata', label: 'Metadata' },
						{ key: 'nonActionPathTaken', label: 'Non Action Path Taken', format: 'boolean' },
						{ key: 'channel', label: 'Channel' },
						{ key: 'channelId', label: 'Channel ID' },
						{ key: 'rotation', label: 'Rotation', format: 'number' },
					],
				},
			],
		},
	],
};
