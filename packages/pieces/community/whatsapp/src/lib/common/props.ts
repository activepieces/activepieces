import { Property } from '@activepieces/pieces-framework';

const to = Property.ShortText({
	displayName: 'To',
	description: 'Recipient phone number in international format, digits only (for example 962791234567).',
	required: true,
});

const replyToMessageId = Property.ShortText({
	displayName: 'Reply To Message ID',
	description: 'Optional WhatsApp message ID (wamid) to send this message as a reply to.',
	required: false,
});

const messageId = Property.ShortText({
	displayName: 'Message ID',
	description: 'The WhatsApp message ID (wamid), for example from the New Incoming Message trigger.',
	required: true,
});

const mediaId = Property.ShortText({
	displayName: 'Media ID',
	description: 'The media ID returned by Upload Media or received on an incoming media message.',
	required: true,
});

const bodyText = Property.LongText({
	displayName: 'Body',
	description: 'Main message text.',
	required: true,
});

const footerText = Property.ShortText({
	displayName: 'Footer',
	description: 'Optional footer text, max 60 characters.',
	required: false,
});

const interactiveHeaderType = Property.StaticDropdown({
	displayName: 'Header Type',
	description: 'Optional header shown above the body: a short text line or a media item from a public URL.',
	required: false,
	defaultValue: 'none',
	options: {
		options: [
			{ label: 'None', value: 'none' },
			{ label: 'Text', value: 'text' },
			{ label: 'Image', value: 'image' },
			{ label: 'Video', value: 'video' },
			{ label: 'Document', value: 'document' },
		],
	},
});

const interactiveHeaderText = Property.ShortText({
	displayName: 'Header Text',
	description: 'Used when Header Type is Text. Max 60 characters.',
	required: false,
});

const interactiveHeaderMediaUrl = Property.ShortText({
	displayName: 'Header Media URL',
	description: 'Public URL of the header image, video or document. Used when Header Type is a media type.',
	required: false,
});

const templateCategory = Property.StaticDropdown({
	displayName: 'Category',
	description: 'Meta reviews and prices the template by category. Utility for transactional updates, Marketing for promotions, Authentication for one-time passcodes.',
	required: true,
	options: {
		options: [
			{ label: 'Marketing', value: 'MARKETING' },
			{ label: 'Utility', value: 'UTILITY' },
			{ label: 'Authentication', value: 'AUTHENTICATION' },
		],
	},
});

const templateComponents = Property.Json({
	displayName: 'Components',
	description:
		'Template components array as documented by Meta. Write variables as [[1]] or [[name]] instead of double curly braces, which Activepieces reserves for its own expressions; they are converted before sending. Example: [{"type":"BODY","text":"Hello [[1]]","example":{"body_text":[["Sam"]]}}].',
	required: true,
});

const businessVertical = Property.StaticDropdown({
	displayName: 'Vertical',
	description: 'Industry shown on the business profile.',
	required: false,
	options: {
		options: [
			'OTHER',
			'AUTO',
			'BEAUTY',
			'APPAREL',
			'EDU',
			'ENTERTAIN',
			'EVENT_PLAN',
			'FINANCE',
			'GROCERY',
			'GOVT',
			'HOTEL',
			'HEALTH',
			'NONPROFIT',
			'PROF_SERVICES',
			'RETAIL',
			'TRAVEL',
			'RESTAURANT',
			'ALCOHOL',
			'ONLINE_GAMBLING',
			'PHYSICAL_GAMBLING',
			'OTC_DRUGS',
		].map((value) => ({ label: value, value })),
	},
});

export const whatsappProps = {
	to,
	replyToMessageId,
	messageId,
	mediaId,
	bodyText,
	footerText,
	interactiveHeaderType,
	interactiveHeaderText,
	interactiveHeaderMediaUrl,
	templateCategory,
	templateComponents,
	businessVertical,
};
