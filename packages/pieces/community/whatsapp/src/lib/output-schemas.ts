import { OutputSchema } from '@activepieces/pieces-framework';

const messageSendFields: OutputSchema['fields'] = [
	{ key: 'messaging_product', label: 'Messaging Product' },
	{
		key: 'contacts',
		label: 'Contacts',
		labelKey: 'wa_id',
		listItems: [
			{ key: 'input', label: 'Input Number' },
			{ key: 'wa_id', label: 'WhatsApp ID' },
		],
	},
	{
		key: 'messages',
		label: 'Messages',
		labelKey: 'id',
		listItems: [
			{ key: 'id', label: 'Message ID' },
			{ key: 'message_status', label: 'Message Status' },
		],
	},
];

const successFields: OutputSchema['fields'] = [{ key: 'success', label: 'Success', format: 'boolean' }];

const mediaInfoFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Media ID' },
	{ key: 'mime_type', label: 'MIME Type' },
	{ key: 'sha256', label: 'SHA-256' },
	{ key: 'file_size', label: 'File Size', format: 'filesize' },
];

const templateFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Template ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'language', label: 'Language' },
	{ key: 'category', label: 'Category' },
	{ key: 'status', label: 'Status' },
	{ key: 'components', label: 'Components' },
	{
		key: 'quality_score',
		label: 'Quality Score',
		children: [
			{ key: 'score', label: 'Score' },
			{ key: 'date', label: 'Scored At' },
		],
	},
];

const phoneNumberFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Phone Number ID' },
	{ key: 'verified_name', label: 'Verified Name' },
	{ key: 'display_phone_number', label: 'Display Phone Number' },
	{ key: 'quality_rating', label: 'Quality Rating' },
	{ key: 'code_verification_status', label: 'Code Verification Status' },
	{ key: 'platform_type', label: 'Platform Type' },
];

const businessProfileFields: OutputSchema['fields'] = [
	{ key: 'messaging_product', label: 'Messaging Product' },
	{ key: 'about', label: 'About' },
	{ key: 'address', label: 'Address' },
	{ key: 'description', label: 'Description' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'profile_picture_url', label: 'Profile Picture', format: 'image' },
	{ key: 'websites', label: 'Websites' },
	{ key: 'vertical', label: 'Vertical' },
];

const incomingMessageCommonFields: OutputSchema['fields'] = [
	{ key: 'message_id', label: 'Message ID' },
	{ key: 'from', label: 'From' },
	{ key: 'contact_name', label: 'Contact Name' },
	{ key: 'timestamp', label: 'Timestamp' },
	{ key: 'received_at', label: 'Received At', format: 'datetime' },
	{ key: 'type', label: 'Type' },
	{ key: 'phone_number_id', label: 'Phone Number ID' },
	{ key: 'display_phone_number', label: 'Display Phone Number' },
];

const incomingMessageContextFields: OutputSchema['fields'] = [
	{ key: 'context_message_id', label: 'Replied-To Message ID' },
	{ key: 'context_from', label: 'Replied-To Sender' },
	{ key: 'forwarded', label: 'Forwarded', format: 'boolean' },
	{ key: 'raw', label: 'Raw Message' },
];

export const messageSendOutputSchema: OutputSchema = { fields: messageSendFields };

export const markMessageAsReadOutputSchema: OutputSchema = { fields: successFields };

export const uploadMediaOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Media ID' }],
};

export const getMediaUrlOutputSchema: OutputSchema = {
	fields: [
		{ key: 'messaging_product', label: 'Messaging Product' },
		{ key: 'url', label: 'Download URL', format: 'url' },
		...mediaInfoFields,
	],
};

export const downloadMediaOutputSchema: OutputSchema = {
	fields: [{ key: 'file', label: 'File', format: 'url' }, ...mediaInfoFields],
};

export const deleteMediaOutputSchema: OutputSchema = { fields: successFields };

export const listMessageTemplatesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'templates', label: 'Templates', listItems: templateFields, labelKey: 'name' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const createMessageTemplateOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Template ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'category', label: 'Category' },
	],
};

export const editMessageTemplateOutputSchema: OutputSchema = {
	fields: [
		...successFields,
		{ key: 'id', label: 'Template ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'category', label: 'Category' },
	],
};

export const deleteMessageTemplateOutputSchema: OutputSchema = { fields: successFields };

export const listPhoneNumbersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'phone_numbers', label: 'Phone Numbers', listItems: phoneNumberFields, labelKey: 'display_phone_number' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const getPhoneNumberOutputSchema: OutputSchema = {
	fields: [
		...phoneNumberFields,
		{ key: 'name_status', label: 'Name Status' },
		{ key: 'status', label: 'Status' },
		{ key: 'throughput', label: 'Throughput', children: [{ key: 'level', label: 'Level' }] },
	],
};

export const getBusinessProfileOutputSchema: OutputSchema = { fields: businessProfileFields };

export const updateBusinessProfileOutputSchema: OutputSchema = { fields: successFields };

export const newIncomingMessageOutputSchema: OutputSchema = {
	fields: [
		...incomingMessageCommonFields,
		{ key: 'text', label: 'Text' },
		{ key: 'caption', label: 'Caption' },
		{ key: 'media_id', label: 'Media ID' },
		{ key: 'mime_type', label: 'MIME Type' },
		{ key: 'sha256', label: 'SHA-256' },
		{ key: 'filename', label: 'Filename' },
		{ key: 'latitude', label: 'Latitude', format: 'number' },
		{ key: 'longitude', label: 'Longitude', format: 'number' },
		{ key: 'location_name', label: 'Location Name' },
		{ key: 'location_address', label: 'Location Address' },
		{ key: 'interactive_type', label: 'Interactive Type' },
		{ key: 'interactive_reply_id', label: 'Selected Option ID' },
		{ key: 'interactive_reply_title', label: 'Selected Option Title' },
		{ key: 'interactive_reply_description', label: 'Selected Option Description' },
		{ key: 'button_payload', label: 'Template Button Payload' },
		{ key: 'button_text', label: 'Template Button Text' },
		...incomingMessageContextFields,
	],
};

export const newMessageReactionOutputSchema: OutputSchema = {
	fields: [
		...incomingMessageCommonFields,
		{ key: 'reaction_emoji', label: 'Emoji' },
		{ key: 'reaction_message_id', label: 'Reacted-To Message ID' },
		...incomingMessageContextFields,
	],
};

export const messageStatusUpdatedOutputSchema: OutputSchema = {
	fields: [
		{ key: 'message_id', label: 'Message ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'recipient_id', label: 'Recipient' },
		{ key: 'timestamp', label: 'Timestamp' },
		{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
		{ key: 'phone_number_id', label: 'Phone Number ID' },
		{ key: 'display_phone_number', label: 'Display Phone Number' },
		{ key: 'conversation_id', label: 'Conversation ID' },
		{ key: 'conversation_origin', label: 'Conversation Origin' },
		{ key: 'conversation_expires_at', label: 'Conversation Expires At', format: 'datetime' },
		{ key: 'billable', label: 'Billable', format: 'boolean' },
		{ key: 'pricing_model', label: 'Pricing Model' },
		{ key: 'pricing_category', label: 'Pricing Category' },
		{ key: 'error_code', label: 'Error Code', format: 'number' },
		{ key: 'error_title', label: 'Error Title' },
		{ key: 'error_message', label: 'Error Message' },
		{ key: 'error_details', label: 'Error Details' },
		{ key: 'raw', label: 'Raw Status' },
	],
};

export const templateStatusUpdatedOutputSchema: OutputSchema = {
	fields: [
		{ key: 'waba_id', label: 'Business Account ID' },
		{ key: 'event', label: 'Event' },
		{ key: 'message_template_id', label: 'Template ID' },
		{ key: 'message_template_name', label: 'Template Name' },
		{ key: 'message_template_language', label: 'Template Language' },
		{ key: 'reason', label: 'Reason' },
		{ key: 'disable_date', label: 'Disabled At' },
		{ key: 'other_info_title', label: 'Info Title' },
		{ key: 'other_info_description', label: 'Info Description' },
		{ key: 'rejection_reason', label: 'Rejection Reason' },
		{ key: 'rejection_recommendation', label: 'Rejection Recommendation' },
	],
};
