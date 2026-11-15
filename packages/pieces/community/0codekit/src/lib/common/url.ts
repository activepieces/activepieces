import { Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../auth';
import { zeroCodeKitApi } from './client';

export const zeroCodeKitUrl = {
    listShortenedUrls,
    createShortenedUrl,
    shortenedUrlIdentifier,
    shortUrlOf,
    toShortenedUrl,
    normalizeTextList,
};

export const SHORT_URL_BASE = 'https://lyl.ai';

async function listShortenedUrls(apiKey: string): Promise<ShortenedUrl[]> {
    const response = await zeroCodeKitApi.post<ListShortenedUrlsResponse>({
        apiKey,
        path: '/generate/shortenedurl/list',
    });
    return response.shortenedUrls ?? [];
}

async function createShortenedUrl({ apiKey, destination, custom }: CreateShortenedUrlParams): Promise<ShortenedUrlCreatedOutput> {
    const trimmedDestination = destination.trim();
    const response = await zeroCodeKitApi.post<CreateShortenedUrlResponse>({
        apiKey,
        path: '/generate/shortenedurl/add',
        body: {
            destination: trimmedDestination,
            custom: custom?.trim(),
        },
    });
    const identifier = response.identifier ?? custom?.trim() ?? null;
    return {
        identifier,
        short_url: response.shortenedUrl ?? (identifier === null ? null : shortUrlOf(identifier)),
        destination: trimmedDestination,
    };
}

function shortenedUrlIdentifier({ description }: { description: string }) {
    return Property.Dropdown({
        auth: zeroCodeKitAuth,
        displayName: 'Shortened URL',
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, options: [], placeholder: 'Connect your 0CodeKit account first.' };
            }
            try {
                const urls = await listShortenedUrls(auth.secret_text);
                if (urls.length === 0) {
                    return { disabled: true, options: [], placeholder: 'No shortened URLs found. Create one first.' };
                }
                return {
                    disabled: false,
                    options: urls.map((url) => ({
                        label: `${shortUrlOf(url.identifier)} → ${url.destination}`,
                        value: url.identifier,
                    })),
                };
            } catch (error) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: zeroCodeKitApi.describe({ error, fallback: 'Could not load shortened URLs.' }),
                };
            }
        },
    });
}

function shortUrlOf(identifier: string): string {
    return `${SHORT_URL_BASE}/${identifier}`;
}

function toShortenedUrl(url: ShortenedUrl): ShortenedUrlOutput {
    return {
        identifier: url.identifier,
        short_url: shortUrlOf(url.identifier),
        destination: url.destination,
        created_at: url.createdAt ?? null,
    };
}

function normalizeTextList(values: unknown[]): string[] {
    return values
        .flat()
        .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);
}

export type ShortenedUrl = {
    identifier: string;
    destination: string;
    createdAt?: string;
};

export type ListShortenedUrlsResponse = {
    shortenedUrls?: ShortenedUrl[];
};

export type CreateShortenedUrlResponse = {
    shortenedUrl?: string;
    identifier?: string;
};

export type CreateShortenedUrlParams = {
    apiKey: string;
    destination: string;
    custom?: string;
};

export type ShortenedUrlOutput = {
    identifier: string;
    short_url: string;
    destination: string;
    created_at: string | null;
};

export type ShortenedUrlCreatedOutput = {
    identifier: string | null;
    short_url: string | null;
    destination: string;
};
