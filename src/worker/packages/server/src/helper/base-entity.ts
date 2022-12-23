import {EntitySchema, EntitySchemaColumnOptions} from "typeorm"
import {User} from "shared";


export const BaseColumnSchemaPart = {
    id: {
        type: "bytea",
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
}