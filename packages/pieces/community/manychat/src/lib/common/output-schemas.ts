import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const NO_FACEBOOK_PAGE = 'Empty for accounts without a Facebook page (for example Telegram-only accounts).';

const tagFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Tag ID', format: 'number' },
	{ key: 'name', label: 'Name' },
];

const customFieldFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Custom Field ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type', description: 'text, number, date, datetime, boolean or array.' },
	{ key: 'description', label: 'Description' },
];

const subscriberFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Subscriber ID' },
	{ key: 'status', label: 'Status', description: 'active or unsubscribed.' },
	{ key: 'page_id', label: 'Page ID' },
	{ key: 'name', label: 'Full Name' },
	{ key: 'first_name', label: 'First Name' },
	{ key: 'last_name', label: 'Last Name' },
	{ key: 'gender', label: 'Gender' },
	{ key: 'profile_pic', label: 'Profile Picture', format: 'image' },
	{ key: 'locale', label: 'Locale' },
	{ key: 'language', label: 'Language' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'live_chat_url', label: 'Live Chat URL', format: 'url' },
	{ key: 'last_input_text', label: 'Last Input Text' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'optin_email', label: 'Email Opt-in', format: 'boolean' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'optin_phone', label: 'SMS Opt-in', format: 'boolean' },
	{ key: 'whatsapp_phone', label: 'WhatsApp Phone' },
	{ key: 'optin_whatsapp', label: 'WhatsApp Opt-in', format: 'boolean' },
	{ key: 'whatsapp_username', label: 'WhatsApp Username' },
	{ key: 'ig_username', label: 'Instagram Username' },
	{ key: 'ig_id', label: 'Instagram ID' },
	{ key: 'subscribed', label: 'Subscribed At', format: 'datetime' },
	{ key: 'last_interaction', label: 'Last Interaction', format: 'datetime', description: 'Empty when unknown (for example Telegram subscribers).' },
	{ key: 'ig_last_interaction', label: 'Instagram Last Interaction', format: 'datetime', description: 'Empty when unknown.' },
	{ key: 'last_seen', label: 'Last Seen', format: 'datetime', description: 'Empty when unknown.' },
	{ key: 'ig_last_seen', label: 'Instagram Last Seen', format: 'datetime', description: 'Empty when unknown.' },
	{ key: 'is_followup_enabled', label: 'Follow-up Enabled', format: 'boolean' },
	{ key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
	{
		key: 'custom_fields',
		label: 'Custom Fields',
		labelKey: 'name',
		listItems: [...customFieldFields, { key: 'value', label: 'Value' }],
	},
];

const flowFields: OutputSchemaField[] = [
	{ key: 'ns', label: 'Flow Namespace', description: 'Pass this to "Send Flow to Subscriber".' },
	{ key: 'name', label: 'Name' },
	{ key: 'folder_id', label: 'Folder ID', format: 'number' },
	{ key: 'folder_name', label: 'Folder Path' },
];

const pageFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Page ID', format: 'number', description: NO_FACEBOOK_PAGE },
	{ key: 'name', label: 'Name' },
	{ key: 'category', label: 'Category', description: NO_FACEBOOK_PAGE },
	{ key: 'avatar_link', label: 'Avatar', format: 'image', description: NO_FACEBOOK_PAGE },
	{ key: 'username', label: 'Username', description: NO_FACEBOOK_PAGE },
	{ key: 'about', label: 'About', description: NO_FACEBOOK_PAGE },
	{ key: 'description', label: 'Description', description: NO_FACEBOOK_PAGE },
	{ key: 'is_pro', label: 'Pro Plan', format: 'boolean' },
	{ key: 'timezone', label: 'Timezone', description: 'Account timezone, for example Asia/Amman. Use it to write datetime custom field values with the right UTC offset.' },
];

const searchResult: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'result', label: 'Subscribers', labelKey: 'name', description: 'Up to 100 matches (ManyChat limit).', listItems: subscriberFields },
	],
};

export const manychatOutputSchemas = {
	subscriber: { fields: subscriberFields } satisfies OutputSchema,
	createSubscriber: {
		fields: [
			{ key: 'status', label: 'Status' },
			{ key: 'data', label: 'Subscriber', children: subscriberFields },
		],
	} satisfies OutputSchema,
	searchResult,
	findBySystemField: {
		fields: [
			{ key: 'found', label: 'Found', format: 'boolean' },
			{ key: 'subscriber', label: 'Subscriber', description: 'Empty when no subscriber matches.', children: subscriberFields },
		],
	} satisfies OutputSchema,
	sendContent: {
		fields: [{ key: 'status', label: 'Status', description: 'success when ManyChat accepted the message.' }],
	} satisfies OutputSchema,
	sendFlow: {
		fields: [
			{ key: 'status', label: 'Status' },
			{ key: 'flow_ns', label: 'Flow Namespace' },
			{ key: 'subscriber_id', label: 'Subscriber ID' },
		],
	} satisfies OutputSchema,
	setCustomFields: {
		fields: [
			{ key: 'subscriber', label: 'Subscriber', children: subscriberFields },
			{
				key: 'updated_fields',
				label: 'Updated Fields',
				labelKey: 'name',
				listItems: [
					{ key: 'id', label: 'Custom Field ID', format: 'number' },
					{ key: 'name', label: 'Name' },
					{ key: 'type', label: 'Type' },
					{ key: 'value', label: 'Value Sent' },
				],
			},
		],
	} satisfies OutputSchema,
	tag: { fields: tagFields } satisfies OutputSchema,
	customField: { fields: customFieldFields } satisfies OutputSchema,
	listTags: {
		fields: [
			{ key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
			{ key: 'count', label: 'Count', format: 'number' },
		],
	} satisfies OutputSchema,
	listCustomFields: {
		fields: [
			{ key: 'custom_fields', label: 'Custom Fields', labelKey: 'name', listItems: customFieldFields },
			{ key: 'count', label: 'Count', format: 'number' },
		],
	} satisfies OutputSchema,
	listFlows: {
		fields: [
			{ key: 'flows', label: 'Flows', labelKey: 'name', listItems: flowFields },
			{
				key: 'folders',
				label: 'Folders',
				labelKey: 'name',
				listItems: [
					{ key: 'id', label: 'Folder ID', format: 'number' },
					{ key: 'name', label: 'Name' },
					{ key: 'parent_id', label: 'Parent Folder ID', format: 'number' },
				],
			},
			{ key: 'count', label: 'Flow Count', format: 'number' },
		],
	} satisfies OutputSchema,
	page: { fields: pageFields } satisfies OutputSchema,
};
