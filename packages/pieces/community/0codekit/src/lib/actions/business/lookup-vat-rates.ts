import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitProps } from '../../common/props';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const lookupVatRatesAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'lookup_vat_rates',
    classification: 'READ',
    displayName: 'Lookup VAT Rates',
    description: 'Get the standard and reduced VAT rates of an EU country.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the standard, reduced, super-reduced and parking VAT rates (in percent) of an EU member state. Rates a country does not have are returned as null. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        countryCode: zeroCodeKitProps.euCountry(),
    },
    outputSchema: businessAiOutputSchemas.lookupVatRates,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<VatRatesResponse>({
            apiKey: auth.secret_text,
            path: '/business/lookupvatrates',
            body: { countryCode: propsValue.countryCode },
        });
        return {
            country: response.country ?? null,
            vat_name: response.vat_name ?? null,
            vat_abbreviation: response.vat_abbr ?? null,
            standard_rate: response.standard_rate ?? null,
            reduced_rate: rateOrNull(response.reduced_rate),
            reduced_rate_alternative: rateOrNull(response.reduced_rate_alt),
            super_reduced_rate: rateOrNull(response.super_reduced_rate),
            parking_rate: rateOrNull(response.parking_rate),
        };
    },
});

function rateOrNull(rate: number | boolean | undefined): number | null {
    return typeof rate === 'number' ? rate : null;
}

type VatRatesResponse = {
    country?: string;
    vat_name?: string;
    vat_abbr?: string;
    standard_rate?: number;
    reduced_rate?: number | boolean;
    reduced_rate_alt?: number | boolean;
    super_reduced_rate?: number | boolean;
    parking_rate?: number | boolean;
};
