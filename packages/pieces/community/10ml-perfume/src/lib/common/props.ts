import { Property } from '@activepieces/pieces-framework';

const LOCALES: Record<string, string> = {
	en: 'English',
	de: 'German',
	fr: 'French',
	es: 'Spanish',
	it: 'Italian',
	ro: 'Romanian',
	el: 'Greek',
	hu: 'Hungarian',
	cs: 'Czech',
	pl: 'Polish',
	nl: 'Dutch',
	pt: 'Portuguese',
	sv: 'Swedish',
	da: 'Danish',
	fi: 'Finnish',
	bg: 'Bulgarian',
	hr: 'Croatian',
};

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const dropdownOptions = (values: string[]) => ({
	options: values.map((value) => ({ label: capitalise(value), value })),
});

export const GENDERS = ['men', 'women', 'unisex'];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const OCCASIONS = ['daytime', 'office', 'casual', 'evening', 'date night', 'special occasion'];
export const STYLES = [
	'aquatic', 'boozy', 'clean', 'creamy', 'dark', 'floral', 'fresh', 'citrusy', 'fruity', 'gourmand',
	'green', 'leathery', 'musky', 'powdery', 'sensual', 'smoky', 'spicy', 'sweet', 'woody',
];
export const STEERS = ['fresher', 'sweeter', 'darker', 'lighter', 'longer_lasting', 'more_projection'];
export const CLOSENESS = ['very close', 'similar vibe', 'same spirit'];
export const HOUSE_TYPES = ['designer', 'niche', 'middle-eastern', 'indie', 'celebrity'];
export const GUIDE_TYPES = ['how-to', 'list', 'alternatives', 'note', 'house'];

export const language = Property.StaticDropdown({
	displayName: 'Language',
	description: 'Language of the 10ml.com links and labels in the answer.',
	required: false,
	defaultValue: 'en',
	options: {
		options: Object.entries(LOCALES).map(([value, label]) => ({ label, value })),
	},
});

export const detailedProfiles = Property.Checkbox({
	displayName: 'Detailed Profiles',
	description: 'Add the note pyramid (top, heart, base), seasons, occasions, longevity and projection to each perfume.',
	required: false,
	defaultValue: false,
});

export const limit = (max: number, def: number) =>
	Property.Number({
		displayName: 'Limit',
		description: `How many results to return (1 to ${max}).`,
		required: false,
		defaultValue: def,
		min: 1,
		max,
	});

export const cursor = Property.ShortText({
	displayName: 'Cursor',
	description:
		"To read the next page, paste the next_cursor of the previous run (turn on 'Return Raw Response' to see it). Example: 'bzE'.",
	required: false,
});

export const rawResponse = Property.Checkbox({
	displayName: 'Return Raw Response',
	description:
		'Return the whole answer from the API as one object (with total and next_cursor) instead of a flat list of results.',
	required: false,
	defaultValue: false,
});

export const house = (description: string) =>
	Property.ShortText({
		displayName: 'House',
		description,
		required: false,
	});

export const noteList = (displayName: string, description: string) =>
	Property.Array({
		displayName,
		description,
		required: false,
	});

export const formatFor = (detailed: boolean | undefined) => (detailed ? 'detailed' : 'concise');
