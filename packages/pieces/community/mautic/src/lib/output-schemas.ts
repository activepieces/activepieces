import { OutputSchema } from '@activepieces/pieces-framework';

export const categoryFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'description', label: 'Description' },
	{ key: 'color', label: 'Color' },
	{ key: 'bundle', label: 'Bundle' },
];

export const assetFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'alias', label: 'Alias' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'description', label: 'Description' },
	{ key: 'language', label: 'Language' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
	{ format: 'number', key: 'downloadCount', label: 'Download Count' },
	{ format: 'number', key: 'uniqueDownloadCount', label: 'Unique Download Count' },
	{ format: 'number', key: 'revision', label: 'Revision' },
	{ key: 'extension', label: 'Extension' },
	{ key: 'mime', label: 'Mime' },
	{ format: 'filesize', key: 'size', label: 'Size' },
	{ format: 'url', key: 'downloadUrl', label: 'Download URL' },
	{ key: 'storageLocation', label: 'Storage Location' },
	{ format: 'boolean', key: 'disallow', label: 'Disallow' },
];

export const campaign2Fields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'category', label: 'Category' },
	{ key: 'description', label: 'Description' },
];

export const campaignEventsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'type', label: 'Type' },
	{ key: 'eventType', label: 'Event Type' },
	{ key: 'channel', label: 'Channel' },
	{ key: 'channelId', label: 'Channel ID' },
	{ format: 'number', key: 'order', label: 'Order' },
	{
		children: [{ format: 'number', key: 'points', label: 'Points' }],
		key: 'properties',
		label: 'Properties',
	},
	{ key: 'triggerDate', label: 'Trigger Date' },
	{ format: 'number', key: 'triggerInterval', label: 'Trigger Interval' },
	{ key: 'triggerIntervalUnit', label: 'Trigger Interval Unit' },
	{ key: 'triggerHour', label: 'Trigger Hour' },
	{ key: 'triggerRestrictedStartHour', label: 'Trigger Restricted Start Hour' },
	{ key: 'triggerRestrictedStopHour', label: 'Trigger Restricted Stop Hour' },
	{ key: 'triggerRestrictedDaysOfWeek', label: 'Trigger Restricted Days Of Week' },
	{ key: 'triggerMode', label: 'Trigger Mode' },
	{ key: 'decisionPath', label: 'Decision Path' },
	{ key: 'parent', label: 'Parent' },
	{ key: 'children', label: 'Children' },
];

export const campaignListsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'publicName', label: 'Public Name' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'description', label: 'Description' },
	{ children: categoryFields, key: 'category', label: 'Category' },
];

export const campaignFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'allowRestart', label: 'Allow Restart' },
	{ format: 'datetime', key: 'publishUp', label: 'Publish Up' },
	{ format: 'datetime', key: 'publishDown', label: 'Publish Down' },
	{ key: 'events', label: 'Events', labelKey: 'name', listItems: campaignEventsFields },
	{ key: 'forms', label: 'Forms' },
	{ key: 'lists', label: 'Lists', labelKey: 'name', listItems: campaignListsFields },
	{
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
						children: [
							{ key: 'source', label: 'Source' },
							{ key: 'target', label: 'Target' },
						],
						key: 'anchors',
						label: 'Anchors',
					},
					{ key: 'sourceId', label: 'Source ID' },
					{ key: 'targetId', label: 'Target ID' },
				],
			},
		],
		key: 'canvasSettings',
		label: 'Canvas Settings',
	},
];

export const contactDoNotContactFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ format: 'number', key: 'reason', label: 'Reason' },
	{ key: 'comments', label: 'Comments' },
	{ key: 'channel', label: 'Channel' },
];

export const contactOwner2Fields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'username', label: 'Username' },
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
];

export const roleFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'isAdmin', label: 'Is Admin' },
];

export const contactOwnerFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'username', label: 'Username' },
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
	{ format: 'email', key: 'email', label: 'Email' },
	{ children: roleFields, key: 'role', label: 'Role' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'locale', label: 'Locale' },
	{ format: 'datetime', key: 'lastLogin', label: 'Last Login' },
	{ format: 'datetime', key: 'lastActive', label: 'Last Active' },
];

export const fieldsAll4Fields: OutputSchema['fields'] = [
	{ key: 'id', label: 'ID' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'last_active', label: 'Last Active' },
	{ key: 'title', label: 'Title' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'company', label: 'Company' },
	{ key: 'position', label: 'Position' },
	{ format: 'email', key: 'email', label: 'Email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'mobile', label: 'Mobile' },
	{ key: 'address1', label: 'Address 1' },
	{ key: 'address2', label: 'Address 2' },
	{ key: 'city', label: 'City' },
	{ key: 'state', label: 'State' },
	{ key: 'zipcode', label: 'Zip Code' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'country', label: 'Country' },
	{ key: 'fax', label: 'Fax' },
	{ key: 'preferred_locale', label: 'Preferred Locale' },
	{ key: 'attribution_date', label: 'Attribution Date' },
	{ key: 'attribution', label: 'Attribution' },
	{ key: 'website', label: 'Website' },
	{ key: 'facebook', label: 'Facebook' },
	{ key: 'foursquare', label: 'Foursquare' },
	{ key: 'instagram', label: 'Instagram' },
	{ key: 'linkedin', label: 'LinkedIn' },
	{ key: 'skype', label: 'Skype' },
	{ key: 'twitter', label: 'Twitter' },
];

export const contacts2Fields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ format: 'datetime', key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'color', label: 'Color' },
	{
		children: [{ children: fieldsAll4Fields, key: 'all', label: 'All' }],
		key: 'fields',
		label: 'Fields',
	},
	{ key: 'lastActive', label: 'Last Active' },
	{ key: 'owner', label: 'Owner' },
	{ key: 'ipAddresses', label: 'IP Addresses' },
	{ key: 'tags', label: 'Tags' },
	{ key: 'utmtags', label: 'UTM Tags' },
	{ key: 'stage', label: 'Stage' },
	{ format: 'datetime', key: 'dateIdentified', label: 'Date Identified' },
	{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
	{ key: 'doNotContact', label: 'Do Not Contact' },
	{ key: 'frequencyRules', label: 'Frequency Rules' },
];

export const fieldsAll2Fields: OutputSchema['fields'] = [
	{ key: 'id', label: 'ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'company', label: 'Company' },
	{ key: 'position', label: 'Position' },
	{ format: 'email', key: 'email', label: 'Email' },
	{ key: 'mobile', label: 'Mobile' },
	{ key: 'phone', label: 'Phone' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'fax', label: 'Fax' },
	{ key: 'address1', label: 'Address 1' },
	{ key: 'address2', label: 'Address 2' },
	{ key: 'city', label: 'City' },
	{ key: 'state', label: 'State' },
	{ key: 'zipcode', label: 'Zip Code' },
	{ key: 'country', label: 'Country' },
	{ key: 'preferred_locale', label: 'Preferred Locale' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'last_active', label: 'Last Active' },
	{ key: 'attribution_date', label: 'Attribution Date' },
	{ key: 'attribution', label: 'Attribution' },
	{ key: 'website', label: 'Website' },
	{ key: 'facebook', label: 'Facebook' },
	{ key: 'foursquare', label: 'Foursquare' },
	{ key: 'instagram', label: 'Instagram' },
	{ key: 'linkedin', label: 'LinkedIn' },
	{ key: 'skype', label: 'Skype' },
	{ key: 'twitter', label: 'Twitter' },
];

export const contactsFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'color', label: 'Color' },
	{
		children: [{ children: fieldsAll2Fields, key: 'all', label: 'All' }],
		key: 'fields',
		label: 'Fields',
	},
	{ key: 'lastActive', label: 'Last Active' },
	{ key: 'owner', label: 'Owner' },
	{ key: 'ipAddresses', label: 'IP Addresses' },
	{ key: 'tags', label: 'Tags' },
	{ key: 'utmtags', label: 'UTM Tags' },
	{ key: 'stage', label: 'Stage' },
	{ format: 'datetime', key: 'dateIdentified', label: 'Date Identified' },
	{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
	{ key: 'doNotContact', label: 'Do Not Contact' },
	{ key: 'frequencyRules', label: 'Frequency Rules' },
];

export const ownerRoleFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'isAdmin', label: 'Is Admin' },
	{ key: 'rawPermissions', label: 'Raw Permissions' },
];

export const leadOwnerFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'username', label: 'Username' },
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
	{ format: 'email', key: 'email', label: 'Email' },
	{ key: 'position', label: 'Position' },
	{ children: ownerRoleFields, key: 'role', label: 'Role' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'locale', label: 'Locale' },
	{ format: 'datetime', key: 'lastLogin', label: 'Last Login' },
	{ format: 'datetime', key: 'lastActive', label: 'Last Active' },
	{ key: 'signature', label: 'Signature' },
];

export const deviceLeadFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'color', label: 'Color' },
	{ key: 'title', label: 'Title' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'company', label: 'Company' },
	{ key: 'position', label: 'Position' },
	{ format: 'email', key: 'email', label: 'Email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'mobile', label: 'Mobile' },
	{ key: 'address1', label: 'Address 1' },
	{ key: 'address2', label: 'Address 2' },
	{ key: 'city', label: 'City' },
	{ key: 'state', label: 'State' },
	{ key: 'zipcode', label: 'Zip Code' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'country', label: 'Country' },
	{ key: 'fields', label: 'Fields' },
	{ key: 'lastActive', label: 'Last Active' },
	{ children: leadOwnerFields, key: 'owner', label: 'Owner' },
	{ key: 'ipAddresses', label: 'IP Addresses' },
	{
		key: 'tags',
		label: 'Tags',
		labelKey: 'id',
		listItems: [
			{ format: 'number', key: 'id', label: 'ID' },
			{ key: 'tag', label: 'Tag' },
			{ key: 'description', label: 'Description' },
		],
	},
	{ key: 'utmtags', label: 'UTM Tags' },
	{ key: 'stage', label: 'Stage' },
	{ format: 'datetime', key: 'dateIdentified', label: 'Date Identified' },
	{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
	{ key: 'doNotContact', label: 'Do Not Contact' },
	{ key: 'frequencyRules', label: 'Frequency Rules' },
];

export const deviceFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ children: deviceLeadFields, key: 'lead', label: 'Lead' },
	{ key: 'clientInfo', label: 'Client Info' },
	{ key: 'device', label: 'Device' },
	{ key: 'deviceBrand', label: 'Device Brand' },
	{ key: 'deviceModel', label: 'Device Model' },
	{ key: 'deviceOsName', label: 'Device Os Name' },
	{ key: 'deviceOsShortName', label: 'Device Os Short Name' },
	{ key: 'deviceOsVersion', label: 'Device Os Version' },
	{ key: 'deviceOsPlatform', label: 'Device Os Platform' },
];

export const dynamicContentFiltersFields: OutputSchema['fields'] = [
	{ key: 'glue', label: 'Glue' },
	{ key: 'field', label: 'Field' },
	{ key: 'object', label: 'Object' },
	{ key: 'type', label: 'Type' },
	{ key: 'filter', label: 'Filter' },
	{ key: 'display', label: 'Display' },
	{ key: 'operator', label: 'Operator' },
];

export const dynamicContentUtmTags2Fields: OutputSchema['fields'] = [
	{ key: 'utmMedium', label: 'Utm Medium' },
	{ key: 'utmSource', label: 'Utm Source' },
	{ key: 'utmContent', label: 'Utm Content' },
	{ key: 'utmCampaign', label: 'Utm Campaign' },
];

export const dynamicContentUtmTagsFields: OutputSchema['fields'] = [
	{ key: 'utmSource', label: 'Utm Source' },
	{ key: 'utmMedium', label: 'Utm Medium' },
	{ key: 'utmCampaign', label: 'Utm Campaign' },
	{ key: 'utmContent', label: 'Utm Content' },
];

export const filtersFiltersFields: OutputSchema['fields'] = [
	{ key: 'glue', label: 'Glue' },
	{ key: 'field', label: 'Field' },
	{ key: 'object', label: 'Object' },
	{ key: 'type', label: 'Type' },
	{ key: 'operator', label: 'Operator' },
	{ key: 'display', label: 'Display' },
	{ key: 'filter', label: 'Filter' },
];

export const emailFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ format: 'datetime', key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'language', label: 'Language' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ format: 'email', key: 'fromAddress', label: 'From Address' },
	{ key: 'fromName', label: 'From Name' },
	{ format: 'email', key: 'replyToAddress', label: 'Reply To Address' },
	{ key: 'bccAddress', label: 'Bcc Address' },
	{ key: 'useOwnerAsMailer', label: 'Use Owner As Mailer' },
	{ children: dynamicContentUtmTagsFields, key: 'utmTags', label: 'Utm Tags' },
	{ key: 'preheaderText', label: 'Preheader Text' },
	{ key: 'customHtml', label: 'Custom HTML' },
	{ key: 'plainText', label: 'Plain Text' },
	{ key: 'template', label: 'Template' },
	{ key: 'emailType', label: 'Email Type' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
	{ format: 'boolean', key: 'publicPreview', label: 'Public Preview' },
	{ format: 'number', key: 'readCount', label: 'Read Count' },
	{ format: 'number', key: 'sentCount', label: 'Sent Count' },
	{ format: 'number', key: 'revision', label: 'Revision' },
	{ key: 'assetAttachments', label: 'Asset Attachments' },
	{ key: 'variantStartDate', label: 'Variant Start Date' },
	{ format: 'number', key: 'variantSentCount', label: 'Variant Sent Count' },
	{ format: 'number', key: 'variantReadCount', label: 'Variant Read Count' },
	{ key: 'variantParent', label: 'Variant Parent' },
	{ key: 'variantChildren', label: 'Variant Children' },
	{ key: 'translationParent', label: 'Translation Parent' },
	{ key: 'translationChildren', label: 'Translation Children' },
	{ key: 'unsubscribeForm', label: 'Unsubscribe Form' },
	{
		key: 'dynamicContent',
		label: 'Dynamic Content',
		listItems: [
			{ key: 'tokenName', label: 'Token Name' },
			{ key: 'content', label: 'Content' },
			{
				key: 'filters',
				label: 'Filters',
				listItems: [
					{ key: 'content', label: 'Content' },
					{ key: 'filters', label: 'Filters', listItems: filtersFiltersFields },
				],
			},
		],
	},
	{ key: 'lists', label: 'Lists' },
];

export const eventFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'type', label: 'Type' },
	{ key: 'eventType', label: 'Event Type' },
	{ key: 'channel', label: 'Channel' },
	{ key: 'channelId', label: 'Channel ID' },
	{ format: 'number', key: 'order', label: 'Order' },
	{
		children: [{ format: 'number', key: 'points', label: 'Points' }],
		key: 'properties',
		label: 'Properties',
	},
	{ key: 'triggerDate', label: 'Trigger Date' },
	{ format: 'number', key: 'triggerInterval', label: 'Trigger Interval' },
	{ key: 'triggerIntervalUnit', label: 'Trigger Interval Unit' },
	{ key: 'triggerHour', label: 'Trigger Hour' },
	{ key: 'triggerRestrictedStartHour', label: 'Trigger Restricted Start Hour' },
	{ key: 'triggerRestrictedStopHour', label: 'Trigger Restricted Stop Hour' },
	{ key: 'triggerRestrictedDaysOfWeek', label: 'Trigger Restricted Days Of Week' },
	{ key: 'triggerMode', label: 'Trigger Mode' },
	{ key: 'decisionPath', label: 'Decision Path' },
	{ key: 'parent', label: 'Parent' },
	{ key: 'children', label: 'Children' },
	{ children: campaign2Fields, key: 'campaign', label: 'Campaign' },
];

export const fieldFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'label', label: 'Label' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'type', label: 'Type' },
	{ key: 'group', label: 'Group' },
	{ format: 'number', key: 'order', label: 'Order' },
	{ key: 'object', label: 'Object' },
	{ key: 'defaultValue', label: 'Default Value' },
	{ format: 'boolean', key: 'isRequired', label: 'Is Required' },
	{ format: 'boolean', key: 'isFixed', label: 'Is Fixed' },
	{ format: 'boolean', key: 'isListable', label: 'Is Listable' },
	{ format: 'boolean', key: 'isVisible', label: 'Is Visible' },
	{ format: 'boolean', key: 'isShortVisible', label: 'Is Short Visible' },
	{ format: 'boolean', key: 'isUniqueIdentifier', label: 'Is Unique Identifier' },
	{ format: 'boolean', key: 'isPubliclyUpdatable', label: 'Is Publicly Updatable' },
	{
		children: [
			{
				key: 'list',
				label: 'List',
				labelKey: 'label',
				listItems: [
					{ key: 'label', label: 'Label' },
					{ key: 'value', label: 'Value' },
				],
			},
		],
		key: 'properties',
		label: 'Properties',
	},
	{ format: 'boolean', key: 'isIndex', label: 'Is Index' },
	{ format: 'number', key: 'charLengthLimit', label: 'Char Length Limit' },
];

export const fieldsAll3Fields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'companyemail', label: 'Company Email' },
	{ key: 'companyaddress1', label: 'Company Address 1' },
	{ key: 'companyaddress2', label: 'Company Address 2' },
	{ key: 'companyphone', label: 'Company Phone' },
	{ key: 'companycity', label: 'Company City' },
	{ key: 'companystate', label: 'Company State' },
	{ key: 'companyzipcode', label: 'Company Zip Code' },
	{ key: 'companycountry', label: 'Company Country' },
	{ key: 'companyname', label: 'Company Name' },
	{ key: 'companywebsite', label: 'Company Website' },
	{ key: 'companyindustry', label: 'Company Industry' },
	{ key: 'companydescription', label: 'Company Description' },
	{ key: 'companynumber_of_employees', label: 'Company Number of Employees' },
	{ key: 'companyfax', label: 'Company Fax' },
	{ key: 'companyannual_revenue', label: 'Company Annual Revenue' },
];

export const fieldsAllFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'companyaddress1', label: 'Company Address 1' },
	{ key: 'companyaddress2', label: 'Company Address 2' },
	{ key: 'companyemail', label: 'Company Email' },
	{ key: 'companyphone', label: 'Company Phone' },
	{ key: 'companycity', label: 'Company City' },
	{ key: 'companystate', label: 'Company State' },
	{ key: 'companyzipcode', label: 'Company Zip Code' },
	{ key: 'companycountry', label: 'Company Country' },
	{ key: 'companyname', label: 'Company Name' },
	{ key: 'companywebsite', label: 'Company Website' },
	{ key: 'companynumber_of_employees', label: 'Company Number of Employees' },
	{ key: 'companyfax', label: 'Company Fax' },
	{ key: 'companyannual_revenue', label: 'Company Annual Revenue' },
	{ key: 'companyindustry', label: 'Company Industry' },
	{ key: 'companydescription', label: 'Company Description' },
];

export const filtersFields: OutputSchema['fields'] = [
	{ key: 'search', label: 'Search' },
	{ key: 'includeEvents', label: 'Include Events' },
	{ key: 'excludeEvents', label: 'Exclude Events' },
	{ format: 'datetime', key: 'dateFrom', label: 'Date From' },
	{ format: 'datetime', key: 'dateTo', label: 'Date To' },
];

export const propertiesBarFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'allow_hide', label: 'Allow Hide' },
	{ format: 'number', key: 'push_page', label: 'Push Page' },
	{ format: 'number', key: 'sticky', label: 'Sticky' },
	{ key: 'size', label: 'Size' },
	{ key: 'placement', label: 'Placement' },
];

export const propertiesColorsFields: OutputSchema['fields'] = [
	{ key: 'primary', label: 'Primary' },
	{ key: 'text', label: 'Text' },
	{ key: 'button', label: 'Button' },
	{ key: 'button_text', label: 'Button Text' },
];

export const propertiesContentFields: OutputSchema['fields'] = [
	{ key: 'headline', label: 'Headline' },
	{ key: 'tagline', label: 'Tagline' },
	{ key: 'link_text', label: 'Link Text' },
	{ format: 'url', key: 'link_url', label: 'Link URL' },
	{ key: 'link_new_window', label: 'Link New Window' },
	{ key: 'font', label: 'Font' },
	{ key: 'css', label: 'Css' },
];

export const focusPropertiesFields: OutputSchema['fields'] = [
	{ children: propertiesBarFields, key: 'bar', label: 'Bar' },
	{
		children: [{ key: 'placement', label: 'Placement' }],
		key: 'modal',
		label: 'Modal',
	},
	{
		children: [{ key: 'placement', label: 'Placement' }],
		key: 'notification',
		label: 'Notification',
	},
	{ key: 'page', label: 'Page' },
	{ format: 'number', key: 'animate', label: 'Animate' },
	{ key: 'link_activation', label: 'Link Activation' },
	{ children: propertiesColorsFields, key: 'colors', label: 'Colors' },
	{ children: propertiesContentFields, key: 'content', label: 'Content' },
	{ key: 'when', label: 'When' },
	{ key: 'timeout', label: 'Timeout' },
	{ key: 'frequency', label: 'Frequency' },
	{ key: 'stop_after_conversion', label: 'Stop After Conversion' },
	{ key: 'stop_after_close', label: 'Stop After Close' },
];

export const formActionsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'type', label: 'Type' },
	{ format: 'number', key: 'order', label: 'Order' },
	{
		children: [
			{ key: 'operator', label: 'Operator' },
			{ format: 'number', key: 'points', label: 'Points' },
			{ key: 'group', label: 'Group' },
		],
		key: 'properties',
		label: 'Properties',
	},
];

export const formFieldsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'label', label: 'Label' },
	{ format: 'boolean', key: 'showLabel', label: 'Show Label' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'type', label: 'Type' },
	{ key: 'defaultValue', label: 'Default Value' },
	{ format: 'boolean', key: 'isRequired', label: 'Is Required' },
	{ key: 'validationMessage', label: 'Validation Message' },
	{ key: 'helpMessage', label: 'Help Message' },
	{ format: 'number', key: 'order', label: 'Order' },
	{ key: 'properties', label: 'Properties' },
	{ key: 'validation', label: 'Validation' },
	{ key: 'parent', label: 'Parent' },
	{ key: 'conditions', label: 'Conditions' },
	{ key: 'labelAttributes', label: 'Label Attributes' },
	{ key: 'inputAttributes', label: 'Input Attributes' },
	{ key: 'containerAttributes', label: 'Container Attributes' },
	{ key: 'leadField', label: 'Lead Field' },
	{ format: 'boolean', key: 'saveResult', label: 'Save Result' },
	{ format: 'boolean', key: 'isAutoFill', label: 'Is Auto Fill' },
	{ key: 'mappedObject', label: 'Mapped Object' },
	{ key: 'mappedField', label: 'Mapped Field' },
];

export const listFiltersFields: OutputSchema['fields'] = [
	{ key: 'glue', label: 'Glue' },
	{ key: 'field', label: 'Field' },
	{ key: 'object', label: 'Object' },
	{ key: 'type', label: 'Type' },
	{ key: 'operator', label: 'Operator' },
	{
		children: [{ key: 'filter', label: 'Filter' }],
		key: 'properties',
		label: 'Properties',
	},
];

export const listFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'publicName', label: 'Public Name' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'description', label: 'Description' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'filters', label: 'Filters', listItems: listFiltersFields },
	{ format: 'boolean', key: 'isGlobal', label: 'Is Global' },
	{ format: 'boolean', key: 'isPreferenceCenter', label: 'Is Preference Center' },
];

export const listFilters2Fields: OutputSchema['fields'] = [
	{ key: 'object', label: 'Object' },
	{ key: 'glue', label: 'Glue' },
	{ key: 'field', label: 'Field' },
	{ key: 'type', label: 'Type' },
	{ key: 'operator', label: 'Operator' },
	{
		children: [{ key: 'filter', label: 'Filter' }],
		key: 'properties',
		label: 'Properties',
	},
	{ key: 'filter', label: 'Filter' },
	{ key: 'display', label: 'Display' },
];

export const messageChannelsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'channel', label: 'Channel' },
	{ format: 'number', key: 'channelId', label: 'Channel ID' },
	{ key: 'channelName', label: 'Channel Name' },
	{ format: 'boolean', key: 'isEnabled', label: 'Is Enabled' },
];

export const noteLeadFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'color', label: 'Color' },
	{ key: 'fields', label: 'Fields' },
];

export const noteFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'text', label: 'Text' },
	{ key: 'type', label: 'Type' },
	{ format: 'datetime', key: 'dateTime', label: 'Date Time' },
	{ children: noteLeadFields, key: 'lead', label: 'Lead' },
];

export const notificationFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'heading', label: 'Heading' },
	{ key: 'message', label: 'Message' },
	{ format: 'url', key: 'url', label: 'URL' },
	{ key: 'language', label: 'Language' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'button', label: 'Button' },
	{ children: dynamicContentUtmTagsFields, key: 'utmTags', label: 'Utm Tags' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
	{ format: 'number', key: 'readCount', label: 'Read Count' },
	{ format: 'number', key: 'sentCount', label: 'Sent Count' },
];

export const pageFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'alias', label: 'Alias' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'language', label: 'Language' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
	{ format: 'number', key: 'hits', label: 'Hits' },
	{ format: 'number', key: 'uniqueHits', label: 'Unique Hits' },
	{ format: 'number', key: 'variantHits', label: 'Variant Hits' },
	{ format: 'number', key: 'revision', label: 'Revision' },
	{ key: 'metaDescription', label: 'Meta Description' },
	{ key: 'redirectType', label: 'Redirect Type' },
	{ format: 'url', key: 'redirectUrl', label: 'Redirect URL' },
	{ key: 'isPreferenceCenter', label: 'Is Preference Center' },
	{ key: 'noIndex', label: 'No Index' },
	{ key: 'variantSettings', label: 'Variant Settings' },
	{ key: 'variantStartDate', label: 'Variant Start Date' },
	{ key: 'variantParent', label: 'Variant Parent' },
	{ key: 'variantChildren', label: 'Variant Children' },
	{ key: 'translationParent', label: 'Translation Parent' },
	{ key: 'translationChildren', label: 'Translation Children' },
	{ key: 'template', label: 'Template' },
	{ key: 'customHtml', label: 'Custom HTML' },
];

export const pointFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'type', label: 'Type' },
	{ key: 'description', label: 'Description' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
	{ format: 'number', key: 'delta', label: 'Delta' },
	{ key: 'properties', label: 'Properties' },
	{ format: 'boolean', key: 'repeatable', label: 'Repeatable' },
];

export const pointGroupFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
];

export const reportFiltersFields: OutputSchema['fields'] = [
	{ key: 'column', label: 'Column' },
	{ key: 'glue', label: 'Glue' },
	{ key: 'dynamic', label: 'Dynamic' },
	{ key: 'condition', label: 'Condition' },
	{ key: 'value', label: 'Value' },
];

export const reportsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'system', label: 'System' },
	{ format: 'boolean', key: 'isScheduled', label: 'Is Scheduled' },
	{ key: 'source', label: 'Source' },
	{ key: 'columns', label: 'Columns' },
	{ key: 'filters', label: 'Filters', listItems: reportFiltersFields },
	{ key: 'tableOrder', label: 'Table Order' },
	{ key: 'graphs', label: 'Graphs' },
	{ key: 'groupBy', label: 'Group By' },
	{
		children: [
			{ key: 'showDynamicFilters', label: 'Show Dynamic Filters' },
			{ key: 'hideDateRangeFilter', label: 'Hide Date Range Filter' },
			{ key: 'showGraphsAboveTable', label: 'Show Graphs Above Table' },
		],
		key: 'settings',
		label: 'Settings',
	},
	{ key: 'aggregators', label: 'Aggregators' },
	{ key: 'scheduleUnit', label: 'Schedule Unit' },
	{ key: 'toAddress', label: 'To Address' },
	{ key: 'scheduleDay', label: 'Schedule Day' },
	{ key: 'scheduleMonthFrequency', label: 'Schedule Month Frequency' },
];

export const role2Fields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'isAdmin', label: 'Is Admin' },
	{
		children: [
			{ key: 'lead:leads', label: 'Lead Leads' },
			{ key: 'email:emails', label: 'Email Emails' },
		],
		key: 'rawPermissions',
		label: 'Raw Permissions',
	},
];

export const stageFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ format: 'number', key: 'weight', label: 'Weight' },
	{ key: 'description', label: 'Description' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
];

export const submissionFormFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'alias', label: 'Alias' },
	{ key: 'category', label: 'Category' },
];

export const submissionLeadFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'color', label: 'Color' },
	{ key: 'title', label: 'Title' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'company', label: 'Company' },
	{ key: 'position', label: 'Position' },
	{ format: 'email', key: 'email', label: 'Email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'mobile', label: 'Mobile' },
	{ key: 'address1', label: 'Address 1' },
	{ key: 'address2', label: 'Address 2' },
	{ key: 'city', label: 'City' },
	{ key: 'state', label: 'State' },
	{ key: 'zipcode', label: 'Zip Code' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'country', label: 'Country' },
];

export const triggerEventsFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'type', label: 'Type' },
	{ format: 'number', key: 'order', label: 'Order' },
	{
		children: [
			{ key: 'add_tags', label: 'Add Tags' },
			{ key: 'remove_tags', label: 'Remove Tags' },
		],
		key: 'properties',
		label: 'Properties',
	},
];

export const triggerFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ format: 'datetime', key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'description', label: 'Description' },
	{ key: 'publishUp', label: 'Publish Up' },
	{ key: 'publishDown', label: 'Publish Down' },
	{ format: 'number', key: 'points', label: 'Points' },
	{ key: 'color', label: 'Color' },
	{ key: 'events', label: 'Events', labelKey: 'name', listItems: triggerEventsFields },
	{ format: 'boolean', key: 'triggerExistingLeads', label: 'Trigger Existing Leads' },
];

export const tweetFields: OutputSchema['fields'] = [
	{ format: 'boolean', key: 'isPublished', label: 'Published' },
	{ format: 'datetime', key: 'dateAdded', label: 'Date Added' },
	{ key: 'dateModified', label: 'Date Modified' },
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'text', label: 'Text' },
	{ key: 'language', label: 'Language' },
	{ children: categoryFields, key: 'category', label: 'Category' },
	{ key: 'mediaId', label: 'Media ID' },
	{ key: 'mediaPath', label: 'Media Path' },
	{ format: 'number', key: 'sentCount', label: 'Sent Count' },
	{ format: 'number', key: 'favoriteCount', label: 'Favorite Count' },
	{ format: 'number', key: 'retweetCount', label: 'Retweet Count' },
	{ key: 'description', label: 'Description' },
];

export const typesFields: OutputSchema['fields'] = [
	{ key: 'asset.download', label: 'Asset Download', value: "['asset.download']" },
	{ key: 'campaign.event', label: 'Campaign Event', value: "['campaign.event']" },
	{
		key: 'campaign.event.scheduled',
		label: 'Campaign Event Scheduled',
		value: "['campaign.event.scheduled']",
	},
	{ key: 'campaign_membership', label: 'Campaign Membership' },
	{ key: 'lead.source.created', label: 'Lead Source Created', value: "['lead.source.created']" },
	{
		key: 'lead.source.identified',
		label: 'Lead Source Identified',
		value: "['lead.source.identified']",
	},
	{ key: 'lead.donotcontact', label: 'Lead Donotcontact', value: "['lead.donotcontact']" },
	{ key: 'dynamic.content.sent', label: 'Dynamic Content Sent', value: "['dynamic.content.sent']" },
	{ key: 'email.failed', label: 'Email Failed', value: "['email.failed']" },
	{ key: 'email.read', label: 'Email Read', value: "['email.read']" },
	{ key: 'email.replied', label: 'Email Replied', value: "['email.replied']" },
	{ key: 'email.sent', label: 'Email Sent', value: "['email.sent']" },
	{ key: 'sms.failed', label: 'Sms Failed', value: "['sms.failed']" },
	{ key: 'focus.on_click', label: 'Focus On Click', value: "['focus.on_click']" },
	{ key: 'focus.on_view', label: 'Focus On View', value: "['focus.on_view']" },
	{ key: 'form.submitted', label: 'Form Submitted', value: "['form.submitted']" },
	{ key: 'lead.imported', label: 'Lead Imported', value: "['lead.imported']" },
	{ key: 'integration_sync_issues', label: 'Integration Sync Issues' },
	{ key: 'message.queue', label: 'Message Queue', value: "['message.queue']" },
	{ key: 'page.hit', label: 'Page Hit', value: "['page.hit']" },
	{ key: 'point.gained', label: 'Point Gained', value: "['point.gained']" },
	{ key: 'segment_membership', label: 'Segment Membership' },
	{ key: 'sms.sent', label: 'Sms Sent', value: "['sms.sent']" },
	{ key: 'stage.changed', label: 'Stage Changed', value: "['stage.changed']" },
	{ key: 'sms_reply', label: 'Sms Reply' },
	{ key: 'lead.utmtagsadded', label: 'Lead Utmtagsadded', value: "['lead.utmtagsadded']" },
	{ key: 'page.videohit', label: 'Page Videohit', value: "['page.videohit']" },
];

export const userRole2Fields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'isAdmin', label: 'Is Admin' },
	{
		children: [{ key: 'lead:leads', label: 'Lead Leads' }],
		key: 'rawPermissions',
		label: 'Raw Permissions',
	},
];

export const userRoleFields: OutputSchema['fields'] = [
	{ format: 'number', key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ format: 'boolean', key: 'isAdmin', label: 'Is Admin' },
	{
		children: [
			{ key: 'lead:leads', label: 'Lead Leads' },
			{ key: 'email:emails', label: 'Email Emails' },
		],
		key: 'rawPermissions',
		label: 'Raw Permissions',
	},
];

export const createMauticCompanyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{
					key: 'company',
					label: 'Company',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'score', label: 'Score', format: 'number' },
						{
							key: 'fields',
							label: 'Fields',
							children: [{ key: 'all', label: 'All', children: fieldsAllFields }],
						},
					],
				},
			],
		},
	],
};

export const createMauticContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			children: [{ key: 'contact', label: 'Contact', children: contactsFields }],
		},
	],
};

export const mauticLeadChannelSubscriptionChangedTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'mautic.lead_channel_subscription_changed',
			label: 'Events',
			value: "['mautic.lead_channel_subscription_changed']",
			listItems: [
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
						{ key: 'fields', label: 'Fields' },
						{ key: 'lastActive', label: 'Last Active' },
						{ key: 'owner', label: 'Owner' },
						{ key: 'ipAddresses', label: 'IP Addresses' },
						{ key: 'tags', label: 'Tags' },
						{ key: 'utmtags', label: 'UTM Tags' },
						{ key: 'stage', label: 'Stage' },
						{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
						{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
						{
							key: 'doNotContact',
							label: 'Do Not Contact',
							labelKey: 'id',
							listItems: [
								{ key: 'id', label: 'ID', format: 'number' },
								{ key: 'reason', label: 'Reason', format: 'number' },
								{ key: 'comments', label: 'Comments' },
								{ key: 'channel', label: 'Channel' },
								{ key: 'channelId', label: 'Channel ID' },
							],
						},
						{ key: 'frequencyRules', label: 'Frequency Rules' },
					],
				},
				{ key: 'channel', label: 'Channel' },
				{ key: 'old_status', label: 'Old Status' },
				{ key: 'new_status', label: 'New Status' },
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
			],
		},
	],
};

export const mauticLeadCompanyChangeTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'mautic.lead_company_change',
			label: 'Events',
			value: "['mautic.lead_company_change']",
			listItems: [
				{ key: 'added', label: 'Added', format: 'boolean' },
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
						{ key: 'title', label: 'Title' },
						{ key: 'firstname', label: 'First Name' },
						{ key: 'lastname', label: 'Last Name' },
						{ key: 'company', label: 'Company' },
						{ key: 'position', label: 'Position' },
						{ key: 'email', label: 'Email' },
						{ key: 'phone', label: 'Phone' },
						{ key: 'mobile', label: 'Mobile' },
						{ key: 'address1', label: 'Address 1' },
						{ key: 'address2', label: 'Address 2' },
						{ key: 'city', label: 'City' },
						{ key: 'state', label: 'State' },
						{ key: 'zipcode', label: 'Zip Code' },
						{ key: 'timezone', label: 'Timezone' },
						{ key: 'country', label: 'Country' },
						{ key: 'fields', label: 'Fields' },
						{ key: 'lastActive', label: 'Last Active' },
						{ key: 'owner', label: 'Owner' },
						{ key: 'ipAddresses', label: 'IP Addresses' },
						{ key: 'tags', label: 'Tags' },
						{ key: 'utmtags', label: 'UTM Tags' },
						{ key: 'stage', label: 'Stage' },
						{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
						{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
						{ key: 'doNotContact', label: 'Do Not Contact' },
						{ key: 'frequencyRules', label: 'Frequency Rules' },
					],
				},
				{
					key: 'company',
					label: 'Company',
					children: [
						{ key: 'isPublished', label: 'Published', format: 'boolean' },
						{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
						{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'email', label: 'Email', format: 'email' },
						{ key: 'address1', label: 'Address 1' },
						{ key: 'address2', label: 'Address 2' },
						{ key: 'phone', label: 'Phone' },
						{ key: 'city', label: 'City' },
						{ key: 'state', label: 'State' },
						{ key: 'zipcode', label: 'Zip Code' },
						{ key: 'country', label: 'Country' },
						{ key: 'website', label: 'Website', format: 'url' },
						{ key: 'industry', label: 'Industry' },
						{ key: 'description', label: 'Description' },
						{ key: 'score', label: 'Score', format: 'number' },
						{
							key: 'fields',
							label: 'Fields',
							children: [{ key: 'other', label: 'Other' }],
						},
					],
				},
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
			],
		},
	],
};

export const mauticLeadPostSaveNewTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'mautic.lead_post_save_new',
			label: 'Events',
			value: "['mautic.lead_post_save_new']",
			listItems: [
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
						{ key: 'fields', label: 'Fields' },
						{ key: 'lastActive', label: 'Last Active' },
						{ key: 'owner', label: 'Owner' },
						{ key: 'ipAddresses', label: 'IP Addresses' },
						{ key: 'tags', label: 'Tags' },
						{ key: 'utmtags', label: 'UTM Tags' },
						{ key: 'stage', label: 'Stage' },
						{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
						{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
						{ key: 'doNotContact', label: 'Do Not Contact' },
						{ key: 'frequencyRules', label: 'Frequency Rules' },
					],
				},
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
			],
		},
	],
};

export const mauticLeadPostSaveUpdateTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'mautic.lead_post_save_update',
			label: 'Events',
			value: "['mautic.lead_post_save_update']",
			listItems: [
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
						{ key: 'fields', label: 'Fields' },
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
				{ key: 'timestamp', label: 'Timestamp', format: 'datetime' },
			],
		},
	],
};

export const searchMauticCompanyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID', format: 'number' },
		{ key: 'score', label: 'Score', format: 'number' },
		{
			key: 'fields',
			label: 'Fields',
			children: [
				{ key: 'other', label: 'Other' },
				{ key: 'all', label: 'All', children: fieldsAll3Fields },
			],
		},
	],
};

export const searchMauticContactOutputSchema: OutputSchema = {
	fields: [
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
		{ key: 'owner', label: 'Owner' },
		{ key: 'ipAddresses', label: 'IP Addresses' },
		{ key: 'tags', label: 'Tags' },
		{ key: 'utmtags', label: 'UTM Tags' },
		{ key: 'stage', label: 'Stage' },
		{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
		{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
		{ key: 'doNotContact', label: 'Do Not Contact' },
		{ key: 'frequencyRules', label: 'Frequency Rules' },
	],
};

export const updateMauticCompanyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{
					key: 'company',
					label: 'Company',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'score', label: 'Score', format: 'number' },
						{
							key: 'fields',
							label: 'Fields',
							children: [
								{ key: 'other', label: 'Other' },
								{ key: 'all', label: 'All', children: fieldsAllFields },
							],
						},
					],
				},
			],
		},
	],
};

export const updateMauticContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			children: [
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
						{ key: 'owner', label: 'Owner' },
						{ key: 'ipAddresses', label: 'IP Addresses' },
						{ key: 'tags', label: 'Tags' },
						{ key: 'utmtags', label: 'UTM Tags' },
						{ key: 'stage', label: 'Stage' },
						{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
						{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
						{ key: 'doNotContact', label: 'Do Not Contact' },
						{ key: 'frequencyRules', label: 'Frequency Rules' },
					],
				},
			],
		},
	],
};
