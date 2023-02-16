import { EntitySchemaColumnOptions } from "typeorm";

export const ApIdSchema = {
    type: String,
    length: 21,
} as EntitySchemaColumnOptions;

export const BaseColumnSchemaPart = {
    id: {
        ...ApIdSchema,
        primary: true,
    } as EntitySchemaColumnOptions,
    created: {
        name: "created",
        type: "timestamp with time zone",
        createDate: true,
    } as EntitySchemaColumnOptions,
    updated: {
        name: "updated",
        type: "timestamp with time zone",
        updateDate: true,
    } as EntitySchemaColumnOptions,
};
