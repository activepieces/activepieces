import { zeroCodeKitApi } from './client';

export const vatApi = {
    validate,
};

async function validate({ apiKey, body }: VatCall): Promise<VatValidationOutput> {
    const response = await zeroCodeKitApi.post<VatValidationResponse>({
        apiKey,
        path: '/business/validate/vat',
        body,
    });
    return {
        valid: response.valid ?? null,
        country_code: response.countryCode ?? null,
        vat_number: response.vatNumber ?? null,
        company_name: response.name ?? null,
        company_address: response.address ?? null,
        request_date: response.requestDate ?? null,
    };
}

type VatCall = {
    apiKey: string;
    body: Record<string, unknown>;
};

type VatValidationResponse = {
    countryCode?: string;
    vatNumber?: string;
    requestDate?: string;
    valid?: boolean;
    name?: string;
    address?: string;
};

export type VatValidationOutput = {
    valid: boolean | null;
    country_code: string | null;
    vat_number: string | null;
    company_name: string | null;
    company_address: string | null;
    request_date: string | null;
};
