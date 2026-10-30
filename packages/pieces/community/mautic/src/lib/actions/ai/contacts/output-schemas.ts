import { OutputSchema } from '@activepieces/pieces-framework';

import {
	contactDoNotContactFields,
	contactOwner2Fields,
	contactOwnerFields,
	contacts2Fields,
	contactsFields,
	fieldsAll2Fields,
	fieldsAll4Fields,
	filtersFields,
	typesFields,
} from '../../../output-schemas';

export const mauticAddContactUtmTagsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'firstname', label: 'First Name' },
				{ key: 'lastname', label: 'Last Name' },
				{ key: 'position', label: 'Position' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'phone', label: 'Phone' },
				{ key: 'city', label: 'City' },
				{ key: 'fields', label: 'Fields' },
				{ key: 'lastActive', label: 'Last Active', format: 'datetime' },
				{ key: 'owner', label: 'Owner', children: contactOwnerFields },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{
					key: 'tags',
					label: 'Tags',
					labelKey: 'id',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'tag', label: 'Tag' },
					],
				},
				{
					key: 'utmtags',
					label: 'UTM Tags',
					labelKey: 'id',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{
							key: 'query',
							label: 'Query',
							children: [{ key: 'x', label: 'X' }],
						},
						{ key: 'referer', label: 'Referer', format: 'url' },
						{ key: 'remoteHost', label: 'Remote Host' },
						{ key: 'url', label: 'URL', format: 'url' },
						{ key: 'utmCampaign', label: 'Utm Campaign' },
						{ key: 'utmContent', label: 'Utm Content' },
						{ key: 'utmMedium', label: 'Utm Medium' },
						{ key: 'utmSource', label: 'Utm Source' },
						{ key: 'utmTerm', label: 'Utm Term' },
					],
				},
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
				{ key: 'doNotContact', label: 'Do Not Contact' },
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};

export const mauticAddDoNotContactOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'fields', label: 'Fields' },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{ key: 'tags', label: 'Tags' },
				{ key: 'utmtags', label: 'UTM Tags' },
				{
					key: 'doNotContact',
					label: 'Do Not Contact',
					labelKey: 'id',
					listItems: contactDoNotContactFields,
				},
				{ key: 'frequencyRules', label: 'Frequency Rules' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'company', label: 'Company' },
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
			],
		},
	],
};

export const mauticAdjustContactGroupPointsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'groupScore',
			label: 'Group Score',
			children: [
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'group',
					label: 'Group',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'description', label: 'Description' },
					],
				},
			],
		},
	],
};

export const mauticAdjustContactPointsOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'number' }],
};

export const mauticBatchCreateContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contacts', label: 'Contacts', labelKey: 'id', listItems: contactsFields },
		{ key: 'statusCodes', label: 'Status Codes' },
	],
};

export const mauticBatchDeleteContactsOutputSchema: OutputSchema = {
	fields: [{ key: 'contacts', label: 'Contacts', labelKey: 'id', listItems: contacts2Fields }],
};

export const mauticBatchUpdateContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contacts', label: 'Contacts', labelKey: 'id', listItems: contacts2Fields },
		{ key: 'statusCodes', label: 'Status Codes' },
	],
};

export const mauticCreateContactOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'color', label: 'Color' },
				{
					key: 'fields',
					label: 'Fields',
					children: [{ key: 'all', label: 'All', children: fieldsAll2Fields }],
				},
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'owner', label: 'Owner', children: contactOwner2Fields },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{
					key: 'tags',
					label: 'Tags',
					labelKey: 'id',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'tag', label: 'Tag' },
						{ key: 'description', label: 'Description' },
					],
				},
				{ key: 'utmtags', label: 'UTM Tags' },
				{ key: 'stage', label: 'Stage' },
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
				{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
				{ key: 'doNotContact', label: 'Do Not Contact' },
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};

export const mauticDeleteContactOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'color', label: 'Color' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{
							key: 'all',
							label: 'All',
							children: [
								{ key: 'id', label: 'ID' },
								{ key: 'title', label: 'Title' },
								{ key: 'firstname', label: 'First Name' },
								{ key: 'lastname', label: 'Last Name' },
								{ key: 'company', label: 'Company' },
								{ key: 'position', label: 'Position' },
								{ key: 'email', label: 'Email', format: 'email' },
								{ key: 'mobile', label: 'Mobile' },
								{ key: 'phone', label: 'Phone' },
								{ key: 'points', label: 'Points', format: 'number' },
								{ key: 'fax', label: 'Fax' },
								{ key: 'address1', label: 'Address 1' },
								{ key: 'address2', label: 'Address 2' },
								{ key: 'city', label: 'City' },
								{ key: 'state', label: 'State' },
								{ key: 'zipcode', label: 'Zip Code' },
								{ key: 'country', label: 'Country' },
								{ key: 'preferred_locale', label: 'Preferred Locale' },
								{ key: 'timezone', label: 'Timezone' },
								{ key: 'last_active', label: 'Last Active', format: 'datetime' },
								{ key: 'attribution_date', label: 'Attribution Date' },
								{ key: 'attribution', label: 'Attribution' },
								{ key: 'website', label: 'Website' },
								{ key: 'facebook', label: 'Facebook' },
								{ key: 'foursquare', label: 'Foursquare' },
								{ key: 'instagram', label: 'Instagram' },
								{ key: 'linkedin', label: 'LinkedIn' },
								{ key: 'skype', label: 'Skype' },
								{ key: 'twitter', label: 'Twitter' },
							],
						},
					],
				},
				{ key: 'lastActive', label: 'Last Active', format: 'datetime' },
				{ key: 'owner', label: 'Owner', children: contactOwner2Fields },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{ key: 'tags', label: 'Tags' },
				{ key: 'utmtags', label: 'UTM Tags' },
				{ key: 'stage', label: 'Stage' },
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
				{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
				{
					key: 'doNotContact',
					label: 'Do Not Contact',
					listItems: [
						{ key: 'id', label: 'ID' },
						{ key: 'reason', label: 'Reason', format: 'number' },
						{ key: 'comments', label: 'Comments' },
						{ key: 'channel', label: 'Channel' },
						{ key: 'channelId', label: 'Channel ID' },
					],
				},
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};

export const mauticGetContactOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'color', label: 'Color' },
				{
					key: 'fields',
					label: 'Fields',
					children: [{ key: 'all', label: 'All', children: fieldsAll2Fields }],
				},
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'owner', label: 'Owner', children: contactOwner2Fields },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{
					key: 'tags',
					label: 'Tags',
					labelKey: 'id',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'tag', label: 'Tag' },
						{ key: 'description', label: 'Description' },
					],
				},
				{ key: 'utmtags', label: 'UTM Tags' },
				{ key: 'stage', label: 'Stage' },
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
				{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
				{ key: 'doNotContact', label: 'Do Not Contact' },
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};

export const mauticListActivityOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'events',
			label: 'Events',
			listItems: [
				{ key: 'event', label: 'Event' },
				{ key: 'eventId', label: 'Event ID' },
				{ key: 'eventType', label: 'Event Type' },
				{
					key: 'eventLabel',
					label: 'Event Label',
					children: [{ key: 'href', label: 'Href', format: 'url' }],
				},
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
				{ key: 'contactId', label: 'Contact ID' },
				{
					key: 'details',
					label: 'Details',
					children: [
						{ key: 'objectDescription', label: 'Object Description' },
						{ key: 'asset', label: 'Asset' },
						{ key: 'assetDownloadUrl', label: 'Asset Download URL', format: 'url' },
					],
				},
			],
		},
		{ key: 'filters', label: 'Filters', children: filtersFields },
		{ key: 'order', label: 'Order' },
		{ key: 'types', label: 'Types', children: typesFields },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'maxPages', label: 'Max Pages', format: 'number' },
	],
};

export const mauticListAvailableSegmentsOutputSchema: OutputSchema = {
	fields: [{ key: 'segments', label: 'Segments' }],
};

export const mauticListContactActivityOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'events',
			label: 'Events',
			listItems: [
				{ key: 'event', label: 'Event' },
				{ key: 'eventId', label: 'Event ID' },
				{ key: 'eventLabel', label: 'Event Label' },
				{ key: 'eventType', label: 'Event Type' },
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
				{ key: 'contactId', label: 'Contact ID' },
				{
					key: 'details',
					label: 'Details',
					children: [
						{
							key: 'log',
							label: 'Log',
							children: [
								{ key: 'eventName', label: 'Event Name' },
								{ key: 'actionName', label: 'Action Name' },
								{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
								{ key: 'type', label: 'Type' },
								{ key: 'delta', label: 'Delta' },
								{ key: 'id', label: 'ID' },
								{ key: 'lead_id', label: 'Lead ID' },
							],
						},
						{ key: 'objectDescription', label: 'Object Description' },
					],
				},
			],
		},
		{ key: 'filters', label: 'Filters', children: filtersFields },
		{ key: 'order', label: 'Order' },
		{ key: 'types', label: 'Types', children: typesFields },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'maxPages', label: 'Max Pages', format: 'number' },
	],
};

export const mauticListContactCampaignsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'campaigns',
			label: 'Campaigns',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'listMembership', label: 'List Membership' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'manuallyRemoved', label: 'Manually Removed', format: 'boolean' },
				{ key: 'manuallyAdded', label: 'Manually Added', format: 'boolean' },
			],
		},
	],
};

export const mauticListContactCompaniesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'companies',
			label: 'Companies',
			labelKey: 'id',
			listItems: [
				{ key: 'company_id', label: 'Company ID' },
				{ key: 'date_associated', label: 'Date Associated', format: 'datetime' },
				{ key: 'is_primary', label: 'Is Primary' },
				{ key: 'id', label: 'ID' },
				{ key: 'owner_id', label: 'Owner ID' },
				{ key: 'is_published', label: 'Published' },
				{ key: 'date_added', label: 'Date Added', format: 'datetime' },
				{ key: 'created_by', label: 'Created By' },
				{ key: 'created_by_user', label: 'Created By User' },
				{ key: 'date_modified', label: 'Date Modified', format: 'datetime' },
				{ key: 'modified_by', label: 'Modified By' },
				{ key: 'modified_by_user', label: 'Modified By User' },
				{ key: 'social_cache', label: 'Social Cache' },
				{ key: 'score', label: 'Score' },
				{ key: 'companyemail', label: 'Company Email', format: 'email' },
				{ key: 'companyphone', label: 'Company Phone' },
				{ key: 'companycity', label: 'Company City' },
				{ key: 'companycountry', label: 'Company Country' },
				{ key: 'companyname', label: 'Company Name' },
				{ key: 'companywebsite', label: 'Company Website', format: 'url' },
				{ key: 'companydescription', label: 'Company Description' },
				{ key: 'companynumber_of_employees', label: 'Company Number of Employees' },
			],
		},
	],
};

export const mauticListContactDevicesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'devices',
			label: 'Devices',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'lead', label: 'Lead' },
				{ key: 'clientInfo', label: 'Client Info' },
				{ key: 'device', label: 'Device' },
				{ key: 'deviceBrand', label: 'Device Brand' },
				{ key: 'deviceModel', label: 'Device Model' },
				{ key: 'deviceOsName', label: 'Device Os Name' },
				{ key: 'deviceOsShortName', label: 'Device Os Short Name' },
				{ key: 'deviceOsVersion', label: 'Device Os Version' },
				{ key: 'deviceOsPlatform', label: 'Device Os Platform' },
			],
		},
	],
};

export const mauticListContactFieldsOutputSchema: OutputSchema = {
	fields: [{ key: 'fields', label: 'Fields', dynamicKey: true, labelKey: 'label' }],
};

export const mauticListContactNotesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'notes',
			label: 'Notes',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'text', label: 'Text' },
				{ key: 'type', label: 'Type' },
				{ key: 'dateTime', label: 'Date Time', format: 'datetime' },
				{ key: 'lead', label: 'Lead' },
			],
		},
	],
};

export const mauticListContactOwnersOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'owners',
			label: 'Owners',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
			],
		},
	],
};

export const mauticListContactPointGroupsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'groupScores',
			label: 'Group Scores',
			listItems: [
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'group',
					label: 'Group',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'description', label: 'Description' },
					],
				},
			],
		},
	],
};

export const mauticListContactSegmentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'lists',
			label: 'Lists',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'manuallyRemoved', label: 'Manually Removed', format: 'boolean' },
				{ key: 'manuallyAdded', label: 'Manually Added', format: 'boolean' },
			],
		},
	],
};

export const mauticListContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total' },
		{
			key: 'contacts',
			label: 'Contacts',
			labelKey: 'id',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'color', label: 'Color' },
				{
					key: 'fields',
					label: 'Fields',
					children: [{ key: 'all', label: 'All', children: fieldsAll4Fields }],
				},
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'owner', label: 'Owner', children: contactOwner2Fields },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{
					key: 'tags',
					label: 'Tags',
					labelKey: 'id',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'tag', label: 'Tag' },
						{ key: 'description', label: 'Description' },
					],
				},
				{ key: 'utmtags', label: 'UTM Tags' },
				{ key: 'stage', label: 'Stage' },
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
				{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
				{ key: 'doNotContact', label: 'Do Not Contact' },
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};

export const mauticRemoveContactUtmTagsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'recordFound', label: 'Record Found', format: 'boolean' },
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'firstname', label: 'First Name' },
				{ key: 'lastname', label: 'Last Name' },
				{ key: 'position', label: 'Position' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'phone', label: 'Phone' },
				{ key: 'city', label: 'City' },
				{ key: 'fields', label: 'Fields' },
				{ key: 'lastActive', label: 'Last Active', format: 'datetime' },
				{ key: 'owner', label: 'Owner', children: contactOwnerFields },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{
					key: 'tags',
					label: 'Tags',
					labelKey: 'id',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'tag', label: 'Tag' },
					],
				},
				{ key: 'utmtags', label: 'UTM Tags' },
				{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
				{ key: 'doNotContact', label: 'Do Not Contact' },
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};

export const mauticRemoveDoNotContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'recordFound', label: 'Record Found', format: 'boolean' },
		{
			key: 'contact',
			label: 'Contact',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'points', label: 'Points', format: 'number' },
				{ key: 'fields', label: 'Fields' },
				{ key: 'ipAddresses', label: 'IP Addresses' },
				{ key: 'tags', label: 'Tags' },
				{ key: 'utmtags', label: 'UTM Tags' },
				{
					key: 'doNotContact',
					label: 'Do Not Contact',
					labelKey: 'id',
					listItems: contactDoNotContactFields,
				},
				{ key: 'frequencyRules', label: 'Frequency Rules' },
			],
		},
	],
};
