import { HttpMethod } from '@activepieces/pieces-common';
import { snaprenderApi } from './client';
import { snaprenderBody } from './props';

export const snaprenderCapture = {
    run,
};

async function run({
    apiKey,
    files,
    source,
    format,
    options,
    embedDetails,
    requestedFileName,
}: {
    apiKey: string;
    files: FileWriter;
    source: CaptureSource;
    format: CaptureFormat;
    options: Record<string, unknown>;
    embedDetails?: boolean | null;
    requestedFileName?: string | null;
}): Promise<CaptureOutput> {
    const response = await snaprenderApi.request({
        apiKey,
        method: HttpMethod.POST,
        path: '/v1/screenshot',
        body: {
            [source.type]: source.value,
            format,
            ...options,
            ...(embedDetails === false ? { metadata: false } : {}),
        },
        responseType: 'arraybuffer',
        slowPageHint: true,
    });
    const data = snaprenderApi.toBuffer(response.body);
    const extension = format === 'jpeg' ? 'jpg' : format;
    const name = snaprenderBody.fileName({ requested: requestedFileName, fallback: format === 'pdf' ? 'page' : 'screenshot', extension });
    const file = await files.write({ fileName: name, data });
    const header = (headerName: string) => snaprenderApi.headerValue({ headers: response.headers, name: headerName });
    return {
        file,
        file_name: name,
        format,
        content_type: header('content-type') ?? CONTENT_TYPES[format],
        size_bytes: data.length,
        source: source.type,
        page_url: source.type === 'url' ? source.value : null,
        served_from_cache: header('x-cache') === 'HIT',
        captures_remaining: toInteger(header('x-remaining-credits')),
        render_time_ms: toInteger(header('x-response-time')),
        request_id: header('x-request-id'),
    };
}

function toInteger(value: string | null): number | null {
    if (value === null) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

const CONTENT_TYPES: Record<CaptureFormat, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
};

export type CaptureFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

export type CaptureSource = { type: 'url' | 'html' | 'markdown'; value: string };

export type FileWriter = { write: (params: { fileName: string; data: Buffer }) => Promise<string> };

export type CaptureOutput = {
    file: string;
    file_name: string;
    format: CaptureFormat;
    content_type: string;
    size_bytes: number;
    source: CaptureSource['type'];
    page_url: string | null;
    served_from_cache: boolean;
    captures_remaining: number | null;
    render_time_ms: number | null;
    request_id: string | null;
};
