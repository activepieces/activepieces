import type { Readable } from 'stream';
import * as z from "zod/mini";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export class ApFile {
    constructor(
        public filename: string,
        public data: Buffer,
        public extension?: string
    ) { }

    get base64(): string {
        return this.data.toString('base64');
    }
}

/**
 * A File Reference: a pass-by-reference handle to a stored file. Carries the
 * read URL and metadata but no bytes — bytes are fetched on demand via
 * `stream()` or `buffer()`. Produced by `Property.File({ stream: true })`.
 */
export class ApFileRef {
    public url: string;
    public filename: string;
    public size?: number;
    public mimetype?: string;

    constructor({ url, filename, size, mimetype }: { url: string; filename: string; size?: number; mimetype?: string }) {
        this.url = url;
        this.filename = filename;
        this.size = size;
        this.mimetype = mimetype;
    }

    async stream(): Promise<Readable> {
        // Runtime-only import keeps this class browser-safe; stream() is only ever called in the engine.
        const { Readable } = await import('stream');
        const response = await fetchOrThrow(this.url);
        const body = response.body;
        if (body === null) {
            return Readable.from([]);
        }
        return Readable.from((async function* () {
            const reader = body.getReader();
            try {
                for (;;) {
                    const { done, value } = await reader.read();
                    if (done) {
                        return;
                    }
                    yield value;
                }
            } finally {
                reader.releaseLock();
            }
        })());
    }

    async buffer(): Promise<Buffer> {
        const response = await fetchOrThrow(this.url);
        return Buffer.from(await response.arrayBuffer());
    }
}

async function fetchOrThrow(url: string): Promise<Response> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file reference (${response.status} ${response.statusText}) — the file may have expired past its retention window`);
    }
    return response;
}

export const FileProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(z.unknown(), PropertyType.FILE).shape,
    stream: z.optional(z.boolean()),
})

export const FileRefProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(z.unknown(), PropertyType.FILE).shape,
    stream: z.literal(true),
})

export type FileProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<ApFile, PropertyType.FILE, R>;

export type FileRefProperty<R extends boolean> = BasePropertySchema & {
    stream: true;
} & TPropertyValue<ApFileRef, PropertyType.FILE, R>;
