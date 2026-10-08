import { Property } from '@activepieces/pieces-framework';

export const rssFeedUrl = Property.ShortText({
	displayName: 'RSS Feed URL',
	description: 'Link to the feed itself, not the site homepage; Atom works too.',
	placeholder: 'https://example.com/feed.xml',
	required: true,
});

export const rssFeedUrls = Property.Array({
	displayName: 'RSS Feed URLs',
	description: 'One feed address per row; a feed that fails to load is skipped.',
	required: true,
	defaultValue: [],
});

export const feedItemFilters = {
	limit: Property.Number({
		displayName: 'Limit',
		description: 'Maximum number of items to return, newest first (1–100). Defaults to 20.',
		required: false,
		defaultValue: 20,
	}),
	published_after: Property.DateTime({
		displayName: 'Published After',
		description:
			'Only return items published after this date and time. Items without a publish date are left out.',
		required: false,
	}),
	keyword: Property.ShortText({
		displayName: 'Keyword',
		description:
			'Only return items whose title, summary or content contains this text (case-insensitive).',
		required: false,
	}),
};
