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
