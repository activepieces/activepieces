import { Type } from "@sinclair/typebox";
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

export const FileProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.Unknown(), PropertyType.FILE)
])
    
export type FileProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<ApFile, PropertyType.FILE, R>;
