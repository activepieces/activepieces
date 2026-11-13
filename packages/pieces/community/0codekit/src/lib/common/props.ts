import { Property } from '@activepieces/pieces-framework';

export const zeroCodeKitProps = {
    timeZone,
    dateFormat,
    outputFormat,
    returnTimestamps,
    viesCountry,
    euCountry,
};

function timeZone({ displayName, description, required }: TimeZonePropParams) {
    return Property.StaticDropdown({
        displayName,
        description,
        required,
        options: {
            options: listTimeZones().map((zone) => ({ label: zone, value: zone })),
        },
    });
}

function dateFormat({ displayName, description, required }: FormatPropParams) {
    return Property.ShortText({
        displayName,
        description,
        required,
        placeholder: 'DD.MM.YYYY',
    });
}

function outputFormat() {
    return Property.ShortText({
        displayName: 'Output Date Format',
        description: `How dates in the result are written, using tokens such as \`DD\` (day), \`MM\` (month), \`YYYY\` (year), \`HH:mm\` (time). ${DEFAULT_FORMAT_HINT}`,
        required: false,
        placeholder: 'DD.MM.YYYY',
    });
}

function returnTimestamps() {
    return Property.Checkbox({
        displayName: 'Return Unix Timestamps',
        description: 'Return every date as a Unix timestamp (seconds) instead of formatted text.',
        required: false,
        defaultValue: false,
    });
}

function viesCountry() {
    return Property.StaticDropdown({
        displayName: 'Country',
        description: 'The EU member state that issued the VAT ID.',
        required: true,
        options: {
            options: VIES_COUNTRIES.map((country) => ({
                label: `${country.name} (${country.code})`,
                value: country.code,
            })),
        },
    });
}

function euCountry() {
    return Property.StaticDropdown({
        displayName: 'Country',
        description: 'The EU member state to look up.',
        required: true,
        options: {
            options: EU_COUNTRIES.map((country) => ({
                label: `${country.name} (${country.code})`,
                value: country.code,
            })),
        },
    });
}

function listTimeZones(): string[] {
    const zones = Intl.supportedValuesOf('timeZone');
    return zones.includes('UTC') ? zones : ['UTC', ...zones];
}

const DEFAULT_FORMAT_HINT = 'Leave empty to use the 0CodeKit default.';

const EU_COUNTRIES = [
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GR', name: 'Greece' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IT', name: 'Italy' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MT', name: 'Malta' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'RO', name: 'Romania' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' },
];

const VIES_COUNTRIES = [
    ...EU_COUNTRIES.map((country) => (country.code === 'GR' ? { code: 'EL', name: country.name } : country)),
    { code: 'XI', name: 'Northern Ireland' },
];

type TimeZonePropParams = {
    displayName: string;
    description: string;
    required: boolean;
};

type FormatPropParams = {
    displayName: string;
    description: string;
    required: boolean;
};
