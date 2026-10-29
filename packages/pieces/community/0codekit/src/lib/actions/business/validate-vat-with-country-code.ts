import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitProps } from '../../common/props';
import { vatApi } from '../../common/vat';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const validateVatWithCountryCodeAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'validate_vat_with_country_code',
    classification: 'READ',
    displayName: 'Validate vat with Countrycode and plain ID',
    description: 'Check an EU VAT number against VIES, with the country and the number given separately.',
    audience: 'both',
    aiMetadata: {
        description:
            'Validate an EU VAT number against the VIES service when the country code and the number part are separate values, and return the registered company name and address when available. Use "Checks validity of a VAT ID" when you have the full ID with its country prefix. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        countryCode: zeroCodeKitProps.viesCountry(),
        id: Property.ShortText({
            displayName: 'VAT Number',
            description: 'The VAT number without the country prefix, for example `07643520567`.',
            required: true,
            placeholder: '07643520567',
        }),
    },
    outputSchema: businessAiOutputSchemas.validateVatWithCountryCode,
    async run({ auth, propsValue }) {
        return vatApi.validate({
            apiKey: auth.secret_text,
            body: {
                countryCode: propsValue.countryCode,
                id: propsValue.id.replace(/\s+/g, ''),
            },
        });
    },
});
