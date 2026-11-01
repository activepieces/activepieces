import { OutputSchema } from '@activepieces/pieces-framework';

export const businessAiOutputSchemas = {
    validateBic: {
        fields: [{ key: 'valid', label: 'Valid', format: 'boolean' }],
    },
    validateIban: {
        fields: [{ key: 'valid', label: 'Valid', format: 'boolean' }],
    },
    validateEmail: {
        fields: [
            { key: 'valid', label: 'Valid', format: 'boolean' },
            { key: 'corrected_email', label: 'Corrected Email', format: 'email', description: 'The address with any fixable typo corrected.' },
        ],
    },
    validateVatId: { fields: vatValidationFields() },
    validateVatWithCountryCode: { fields: vatValidationFields() },
    lookupVatRates: {
        fields: [
            { key: 'country', label: 'Country' },
            { key: 'vat_name', label: 'VAT Name' },
            { key: 'vat_abbreviation', label: 'VAT Abbreviation' },
            { key: 'standard_rate', label: 'Standard Rate (%)', format: 'number' },
            { key: 'reduced_rate', label: 'Reduced Rate (%)', format: 'number', description: 'Null when the country has no reduced rate.' },
            { key: 'reduced_rate_alternative', label: 'Alternative Reduced Rate (%)', format: 'number', description: 'Null when the country has no second reduced rate.' },
            { key: 'super_reduced_rate', label: 'Super Reduced Rate (%)', format: 'number', description: 'Null when the country has no super-reduced rate.' },
            { key: 'parking_rate', label: 'Parking Rate (%)', format: 'number', description: 'Null when the country has no parking rate.' },
        ],
    },
    verifyDomain: {
        fields: [
            { key: 'is_valid', label: 'Is Valid', format: 'boolean' },
            { key: 'main_domain', label: 'Main Domain', description: 'The domain without subdomains, for example example.com.' },
        ],
    },
    detectGender: {
        fields: [
            { key: 'gender', label: 'Gender', description: 'male, female or unisex.' },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
        ],
    },
    splitName: {
        fields: [
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
        ],
    },
    textContains: {
        fields: [
            { key: 'contains_any', label: 'Contains Any Keyword', format: 'boolean' },
            { key: 'contains_all', label: 'Contains All Keywords', format: 'boolean' },
            {
                key: 'findings',
                label: 'Findings',
                labelKey: 'keyword',
                description: 'One entry per keyword searched.',
                listItems: [
                    { key: 'keyword', label: 'Keyword' },
                    { key: 'contains', label: 'Contains', format: 'boolean' },
                    { key: 'match_count', label: 'Match Count', format: 'number' },
                    { key: 'found_positions', label: 'Found Positions', description: 'Comma-separated character positions of each match.' },
                ],
            },
        ],
    },
    entityDetection: {
        fields: [
            { key: 'entity_count', label: 'Entity Count', format: 'number' },
            {
                key: 'entities',
                label: 'Entities',
                labelKey: 'text',
                listItems: [
                    { key: 'text', label: 'Text' },
                    { key: 'category', label: 'Category', description: 'For example Person, Location, Organization or DateTime.' },
                    { key: 'sub_category', label: 'Sub-Category' },
                    { key: 'offset', label: 'Offset', format: 'number' },
                    { key: 'length', label: 'Length', format: 'number' },
                    { key: 'confidence_score', label: 'Confidence Score', format: 'number', description: 'Between 0 and 1.' },
                ],
            },
        ],
    },
    languageDetection: {
        fields: [
            { key: 'language_name', label: 'Language Name' },
            { key: 'language_code', label: 'Language Code', description: 'Two-letter ISO 639-1 code.' },
            { key: 'confidence_score', label: 'Confidence Score', format: 'number', description: 'Between 0 and 1.' },
        ],
    },
    moodDetection: {
        fields: [
            { key: 'mood', label: 'Overall Mood', description: 'positive, neutral, negative or mixed.' },
            { key: 'positive_score', label: 'Positive Score', format: 'number' },
            { key: 'neutral_score', label: 'Neutral Score', format: 'number' },
            { key: 'negative_score', label: 'Negative Score', format: 'number' },
            {
                key: 'sentences',
                label: 'Sentences',
                labelKey: 'text',
                listItems: [
                    { key: 'text', label: 'Text' },
                    { key: 'mood', label: 'Mood' },
                ],
            },
        ],
    },
    pictureObjectRecognition: {
        fields: [
            { key: 'label_count', label: 'Label Count', format: 'number' },
            { key: 'labels', label: 'Labels', description: 'Short labels for the objects and scenes found in the image.' },
        ],
    },
    pictureTextRecognition: {
        fields: [
            { key: 'text', label: 'Text', description: 'All recognized lines joined with line breaks.' },
            { key: 'line_count', label: 'Line Count', format: 'number' },
            { key: 'lines', label: 'Lines' },
        ],
    },
    translateText: {
        fields: [
            { key: 'translation', label: 'Translation' },
            { key: 'target_language', label: 'Target Language', description: 'Two-letter ISO 639-1 code.' },
        ],
    },
} satisfies Record<string, OutputSchema>;

function vatValidationFields(): OutputSchema['fields'] {
    return [
        { key: 'valid', label: 'Valid', format: 'boolean', description: 'True when VIES confirms the VAT number is registered and active.' },
        { key: 'country_code', label: 'Country Code' },
        { key: 'vat_number', label: 'VAT Number', description: 'The VAT number without its country prefix.' },
        { key: 'company_name', label: 'Company Name', description: 'Registered company name, or null when the member state does not share it.' },
        { key: 'company_address', label: 'Company Address', description: 'Registered company address, or null when the member state does not share it.' },
        { key: 'request_date', label: 'Request Date', format: 'date', description: 'The date VIES answered the check.' },
    ];
}
