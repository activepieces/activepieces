import { zeroCodeKitApi } from './client';

export const nationIsoApi = {
    convert,
};

async function convert({ apiKey, body }: NationIsoCall): Promise<NationIsoOutput> {
    const response = await zeroCodeKitApi.post<NationIsoResponse>({
        apiKey,
        path: '/convert/nationiso',
        body,
    });
    return {
        iso_code: response.iso ?? null,
        nation: response.nation ?? null,
    };
}

type NationIsoCall = {
    apiKey: string;
    body: Record<string, unknown>;
};

type NationIsoResponse = {
    iso?: string;
    nation?: string;
};

export type NationIsoOutput = {
    iso_code: string | null;
    nation: string | null;
};
