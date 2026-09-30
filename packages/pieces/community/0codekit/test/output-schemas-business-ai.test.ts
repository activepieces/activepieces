import { OutputSchema } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupVatRatesAction } from '../src/lib/actions/business/lookup-vat-rates';
import { validateBicAction } from '../src/lib/actions/business/validate-bic';
import { validateEmailAction } from '../src/lib/actions/business/validate-email';
import { validateIbanAction } from '../src/lib/actions/business/validate-iban';
import { validateVatIdAction } from '../src/lib/actions/business/validate-vat-id';
import { validateVatWithCountryCodeAction } from '../src/lib/actions/business/validate-vat-with-country-code';
import { verifyDomainAction } from '../src/lib/actions/business/verify-domain';
import { detectGenderAction } from '../src/lib/actions/text/detect-gender';
import { splitNameAction } from '../src/lib/actions/text/split-name';
import { textContainsAction } from '../src/lib/actions/text/text-contains';
import { runAction, TestAction } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

const VAT_RESPONSE = {
    countryCode: 'DE',
    vatNumber: '123456789',
    requestDate: '2025-01-20',
    valid: true,
    name: 'ACME',
    address: 'Street 1',
};

const CASES: SchemaCase[] = [
    { action: validateBicAction, props: { bic: 'DEUTDEFF' }, response: { valid: true } },
    { action: validateIbanAction, props: { iban: 'DE02120300000000202051' }, response: { valid: true } },
    { action: validateEmailAction, props: { email: 'jane@gmial.com' }, response: { valid: true, emailCorrected: 'jane@gmail.com' } },
    { action: validateVatIdAction, props: { vatId: 'DE123456789' }, response: VAT_RESPONSE },
    { action: validateVatWithCountryCodeAction, props: { countryCode: 'DE', id: '123456789' }, response: VAT_RESPONSE },
    {
        action: lookupVatRatesAction,
        props: { countryCode: 'DE' },
        response: {
            country: 'Germany',
            vat_name: 'Umsatzsteuer',
            vat_abbr: 'USt',
            standard_rate: 19,
            reduced_rate: 7,
            reduced_rate_alt: false,
            super_reduced_rate: false,
            parking_rate: false,
        },
    },
    { action: verifyDomainAction, props: { domain: 'https://www.example.com' }, response: { isValid: true, mainDomain: 'example.com' } },
    { action: detectGenderAction, props: { fullName: 'Jane Doe' }, response: { firstname: 'Jane', lastname: 'Doe', detectedGender: 'female' } },
    { action: splitNameAction, props: { name: 'Jane Doe' }, response: { firstName: 'Jane', lastName: 'Doe' } },
    {
        action: textContainsAction,
        props: { text: 'the cat sat', keywords: ['cat'] },
        response: { findings: [{ keyword: 'cat', contains: true, foundPositions: [4] }] },
    },
];

beforeEach(() => {
    sendRequest.mockReset();
});

describe('business and text output schemas', () => {
    it.each(CASES.map((testCase) => [testCase.action.name, testCase]))('%s schema matches its run() output', async (_, testCase) => {
        sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: testCase.response });

        const output = await runAction({ action: testCase.action, propsValue: testCase.props });

        expect(testCase.action.outputSchema).toBeDefined();
        expectFieldsMatch({ fields: testCase.action.outputSchema?.fields ?? [], value: output });
    });
});

function expectFieldsMatch({ fields, value }: { fields: OutputSchema['fields']; value: unknown }): void {
    expect(isRecord(value)).toBe(true);
    if (!isRecord(value)) {
        return;
    }
    expect(fields.map((field) => field.value ?? field.key).sort()).toEqual(Object.keys(value).sort());
    for (const field of fields) {
        const nested = value[field.value ?? field.key];
        if (field.listItems) {
            expect(Array.isArray(nested) && nested.length > 0).toBe(true);
            if (Array.isArray(nested)) {
                nested.forEach((item) => expectFieldsMatch({ fields: field.listItems ?? [], value: item }));
            }
        }
        if (field.children) {
            expectFieldsMatch({ fields: field.children, value: nested });
        }
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type SchemaCase = {
    action: TestAction & {
        name: string;
        outputSchema?: OutputSchema;
    };
    props: Record<string, unknown>;
    response: unknown;
};
