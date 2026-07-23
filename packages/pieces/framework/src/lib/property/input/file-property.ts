import type { Readable } from "node:stream";
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

export const FileProperty = z.object({
    ...BasePropertySchema.shape,
    streaming: z.optional(z.boolean()),
    ...TPropertyValue(z.unknown(), PropertyType.FILE).shape,
})

export type ApStreamingFile = {
    filename: string;
    extension?: string;
    size?: number;
    body: Readable;
};

export type FileProperty<R extends boolean, S extends boolean = false> = BasePropertySchema & {
    streaming?: S;
} & TPropertyValue<S extends true ? ApStreamingFile : ApFile, PropertyType.FILE, R>;
