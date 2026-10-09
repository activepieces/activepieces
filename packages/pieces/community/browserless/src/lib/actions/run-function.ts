import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessOutputSchemas } from '../output-schemas';

export const runFunction = createAction({
    auth: browserlessAuth,
    name: 'run_function',
    classification: 'WRITE',
    displayName: 'Run Puppeteer Function',
    description: 'Run your own Puppeteer code in a Browserless browser and return what it returns.',
    audience: 'both',
    aiMetadata: {
        description:
            'Runs caller-supplied Puppeteer code (an ES module whose default export receives { page, context }) in a fresh Browserless browser and returns the `data` it returns: JSON or text, or a stored file when `type` is binary (for example application/pdf). Use only when Smart Scrape, Scrape URL, Capture Screenshot or BQL cannot do the job. The code can click, submit forms and change remote state, so it is not safe to retry blindly.',
        idempotent: false,
    },
    props: {
        instructions: Property.MarkDown({
            value: 'Write an ES module whose default export is an async function. It receives `{ page, context }` and should return `{ data, type }`, for example:\n\n```js\nexport default async function ({ page, context }) {\n  await page.goto(context.url);\n  return { data: { title: await page.title() }, type: "application/json" };\n}\n```',
        }),
        code: Property.LongText({
            displayName: 'Code',
            description: 'The Puppeteer module to run.',
            required: true,
        }),
        context: Property.Object({
            displayName: 'Context',
            description: 'Values your function receives as `context`.',
            required: false,
        }),
        timeout: browserlessProps.sessionTimeout(),
    },
    outputSchema: browserlessOutputSchemas.runFunction,
    async run(context) {
        const props = context.propsValue;
        if (!browserlessBody.nonEmpty(props.code)) {
            throw new Error('Enter the code to run.');
        }
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/function',
            body: {
                code: props.code,
                ...(props.context && Object.keys(props.context).length > 0 ? { context: props.context } : {}),
            },
            query: { timeout },
            responseType: 'arraybuffer',
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Run Puppeteer Function',
        });

        const headerType = (browserlessApi.headerValue({ headers: response.headers, name: 'content-type' }) ?? 'application/octet-stream').toLowerCase();
        const buffer = browserlessApi.toBuffer(response.body);
        if (!isTextual(headerType)) {
            return writeFileResult({ files: context.files, contentType: headerType, bytes: buffer });
        }
        const text = buffer.toString('utf8');
        const parsed = headerType.includes('json') ? parseJson(text) : text;
        const envelope = readEnvelope(parsed);
        if (envelope === null) {
            return { content_type: headerType, result: parsed, file: null, size_bytes: buffer.length };
        }
        if (!isTextual(envelope.type)) {
            const bytes = toBytes(envelope.data);
            if (bytes !== null) {
                return writeFileResult({ files: context.files, contentType: envelope.type, bytes });
            }
        }
        return { content_type: envelope.type, result: envelope.data, file: null, size_bytes: buffer.length };
    },
});

async function writeFileResult({ files, contentType, bytes }: { files: { write: (params: { fileName: string; data: Buffer }) => Promise<string> }; contentType: string; bytes: Buffer }) {
    const file = await files.write({ fileName: `function-result.${extensionFor(contentType)}`, data: bytes });
    return { content_type: contentType, result: null, file, size_bytes: bytes.length };
}

function readEnvelope(value: unknown): { data: unknown; type: string } | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null;
    }
    const keys = Object.keys(value);
    const type: unknown = Reflect.get(value, 'type');
    if (!keys.includes('data') || typeof type !== 'string' || keys.some((key) => key !== 'data' && key !== 'type')) {
        return null;
    }
    return { data: Reflect.get(value, 'data'), type: type.toLowerCase() };
}

function toBytes(value: unknown): Buffer | null {
    if (typeof value === 'string') {
        return Buffer.from(value, 'base64');
    }
    if (Array.isArray(value)) {
        return value.every(isByte) ? Buffer.from(value) : null;
    }
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const nodeBuffer: unknown = Reflect.get(value, 'data');
    if (Reflect.get(value, 'type') === 'Buffer' && Array.isArray(nodeBuffer)) {
        return nodeBuffer.every(isByte) ? Buffer.from(nodeBuffer) : null;
    }
    const entries = Object.entries(value);
    if (entries.length === 0 || !entries.every(([key, byte], index) => key === String(index) && isByte(byte))) {
        return null;
    }
    return Buffer.from(entries.map(([, byte]) => Number(byte)));
}

function isByte(value: unknown): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;
}

function isTextual(contentType: string): boolean {
    return contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('xml') || contentType.includes('javascript');
}

function parseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function extensionFor(contentType: string): string {
    if (contentType.includes('pdf')) {
        return 'pdf';
    }
    if (contentType.includes('png')) {
        return 'png';
    }
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        return 'jpg';
    }
    if (contentType.includes('webp')) {
        return 'webp';
    }
    if (contentType.includes('zip')) {
        return 'zip';
    }
    return 'bin';
}
