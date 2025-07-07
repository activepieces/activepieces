import { Property } from '@activepieces/pieces-framework';

export const countryDropdown = Property.StaticDropdown({
    displayName: 'Preferred Country',
    description:
        "The country to use for the search. It's a two-letter country code.",
    required: false,
    defaultValue: 'Default',
    options: {
        options: [
            { label: 'Default', value: 'Default' },
            { label: 'United States', value: 'US' },
            { label: 'Canada', value: 'CA' },
            { label: 'Mexico', value: 'MX' },
            { label: 'United Kingdom', value: 'GB' },
            { label: 'Germany', value: 'DE' },
            { label: 'France', value: 'FR' },
            { label: 'Japan', value: 'JP' },
            { label: 'China', value: 'CN' },
            { label: 'India', value: 'IN' },
            { label: 'Brazil', value: 'BR' },
            { label: 'Australia', value: 'AU' },
            { label: 'Italy', value: 'IT' },
            { label: 'Spain', value: 'ES' },
            { label: 'South Korea', value: 'KR' },
            { label: 'Netherlands', value: 'NL' },
            { label: 'Switzerland', value: 'CH' },
            { label: 'Sweden', value: 'SE' },
            { label: 'Ireland', value: 'IE' },
            { label: 'Singapore', value: 'SG' },
            { label: 'Israel', value: 'IL' },
            { label: 'Saudi Arabia', value: 'SA' },
            { label: 'South Africa', value: 'ZA' },
            { label: 'United Arab Emirates', value: 'AE' },
        ],
    },
});
