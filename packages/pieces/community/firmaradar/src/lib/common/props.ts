import { Property } from '@activepieces/pieces-framework';

/** Shared prop factories so wording stays consistent across actions. */

export const orgnrProp = (description?: string) =>
    Property.ShortText({
        displayName: 'Organisation Number',
        description: description ?? 'Nine-digit Norwegian organisation number (orgnr), e.g. 923609016.',
        required: true,
    });

export const orgnrsProp = (max: number, description?: string) =>
    Property.Array({
        displayName: 'Organisation Numbers',
        description:
            description ??
            `Up to ${max} nine-digit Norwegian organisation numbers. ` +
                'Each entry may also contain comma- or space-separated values.',
        required: true,
    });

export const limitProp = (defaultValue: number, max: number) =>
    Property.Number({
        displayName: 'Limit',
        description: `Maximum number of results per page (1-${max}).`,
        required: false,
        defaultValue,
    });

export const cursorProp = () =>
    Property.ShortText({
        displayName: 'Cursor',
        description:
            'Opaque pagination token from the previous response (`next_cursor`). ' +
            'Leave empty for the first page.',
        required: false,
    });

export const amlPurposeProp = () =>
    Property.StaticDropdown({
        displayName: 'Screening Purpose',
        description:
            'Purpose recorded in the audit trail (sent as `X-FR-Purpose`). ' +
            'Required by the Firmaradar DPA gate for AML endpoints.',
        required: true,
        defaultValue: 'kyc_onboarding',
        options: {
            options: [
                { label: 'KYC onboarding (new customer)', value: 'kyc_onboarding' },
                { label: 'KYC review (existing customer)', value: 'kyc_review' },
                { label: 'Risk monitoring', value: 'risk_monitoring' },
                { label: 'Manual request', value: 'manual' },
            ],
        },
    });

export const dpaConfirmedProp = () =>
    Property.Checkbox({
        displayName: 'I Confirm DPA Coverage',
        description:
            'Confirm that a signed data processing agreement (DPA) with ' +
            'Firmaradar covers this screening. Sent as `X-FR-DPA-Confirmed`. ' +
            'The call is rejected without this confirmation.',
        required: true,
        defaultValue: false,
    });
