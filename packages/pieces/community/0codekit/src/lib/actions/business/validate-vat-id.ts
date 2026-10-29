import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { vatApi } from '../../common/vat';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const validateVatIdAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'validate_vat_id',
    classification: 'READ',
    displayName: 'Checks validity of a VAT ID',
    description: 'Check a full EU VAT ID, including its country prefix, against VIES.',
    audience: 'both',
    aiMetadata: {
        description:
            'Validate a full EU VAT ID that starts with its two-letter country prefix (for example DE123456789) against the VIES service, and return the registered company name and address when available. Use "Validate vat with Countrycode and plain ID" when the country and number are separate. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        vatId: Property.ShortText({
            displayName: 'VAT ID',
            description: 'The full VAT ID, starting with the two-letter country code.',
            required: true,
            placeholder: 'DE123456789',
        }),
    },
    outputSchema: businessAiOutputSchemas.validateVatId,
    async run({ auth, propsValue }) {
        return vatApi.validate({
            apiKey: auth.secret_text,
            body: {
                vatId: propsValue.vatId.replace(/\s+/g, '').toUpperCase(),
            },
        });
    },
});
