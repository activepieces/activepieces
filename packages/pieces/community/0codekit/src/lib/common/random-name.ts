import { zeroCodeKitApi } from './client';

export const randomNameApi = {
    generate,
};

async function generate({ apiKey, body }: RandomNameCall): Promise<RandomNameOutput> {
    const response = await zeroCodeKitApi.post<RandomNameResponse>({
        apiKey,
        path: '/generate/name',
        body,
    });
    return {
        first_name: response.firstName ?? null,
        middle_name: response.middleName ?? null,
        last_name: response.lastName ?? null,
        full_name: response.completeName ?? null,
        full_name_with_middle_name: response.completeNameWithMiddleName ?? null,
    };
}

type RandomNameCall = {
    apiKey: string;
    body: Record<string, unknown>;
};

type RandomNameResponse = {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    completeName?: string;
    completeNameWithMiddleName?: string;
};

export type RandomNameOutput = {
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    full_name: string | null;
    full_name_with_middle_name: string | null;
};
