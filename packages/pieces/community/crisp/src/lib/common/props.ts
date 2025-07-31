import { Property } from '@activepieces/pieces-framework';

export const websiteIdProp = Property.ShortText({
	displayName: 'Website ID',
	description:
		'You can obtain website ID by navigating to Settings -> Workspace Settings -> Setup & Integrations.',
	required: true,
});

export const sessionIdProp = Property.ShortText({
	displayName: 'Conversation ID (session_id)',
	description:`You can obtain session from URL address bar.It starts with 'session_'.`,
	required: true,
});
