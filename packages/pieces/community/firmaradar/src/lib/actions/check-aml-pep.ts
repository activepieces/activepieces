import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { dpaHeaders, firmaradarRequest } from '../common/client';
import { amlPurposeProp, dpaConfirmedProp } from '../common/props';

export const checkAmlPep = createAction({
    name: 'check_aml_pep',
    auth: firmaradarAuth,
    displayName: 'Check AML / PEP',
    description:
        'Screen a person against sanctions and PEP lists (exact + fuzzy matching) ' +
        'as part of KYC onboarding or periodic review. Requires a signed DPA and ' +
        'a per-call confirmation; every request is written to a 60-month audit trail.',
    props: {
        name: Property.ShortText({
            displayName: 'Person Name',
            description: 'Full name to screen (2-200 characters).',
            required: true,
        }),
        birthYear: Property.Number({
            displayName: 'Birth Year',
            description: 'Optional birth year (1900-2100) to sharpen matching.',
            required: false,
        }),
        kategori: Property.StaticDropdown({
            displayName: 'Screening Category',
            required: false,
            defaultValue: 'both',
            options: {
                options: [
                    { label: 'Sanctions + PEP', value: 'both' },
                    { label: 'Sanctions only', value: 'sanksjon' },
                    { label: 'PEP only', value: 'pep' },
                ],
            },
        }),
        minMatchRatio: Property.Number({
            displayName: 'Minimum Match Ratio',
            description: 'Fuzzy-match threshold between 0 and 1. Default 0.85.',
            required: false,
        }),
        purpose: amlPurposeProp(),
        dpaConfirmed: dpaConfirmedProp(),
    },
    async run(context) {
        const body: Record<string, unknown> = {
            name: context.propsValue.name,
        };
        if (context.propsValue.birthYear) {
            body.birth_year = context.propsValue.birthYear;
        }
        if (context.propsValue.kategori) {
            body.kategori = context.propsValue.kategori;
        }
        if (context.propsValue.minMatchRatio !== undefined && context.propsValue.minMatchRatio !== null) {
            body.min_match_ratio = context.propsValue.minMatchRatio;
        }
        return firmaradarRequest(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/aml/check',
            headers: dpaHeaders(context.propsValue.purpose, context.propsValue.dpaConfirmed),
            body,
        });
    },
});
