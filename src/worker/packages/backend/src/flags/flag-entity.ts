import {EntitySchema} from "typeorm"
import {ApIdSchema, BaseColumnSchemaPart} from "../helper/base-entity";
import {Flag} from "shared";

interface FlagSchema extends Flag {

}

export const FlagEntity = new EntitySchema<FlagSchema>({
    name: "flag",
    columns: {
        ...BaseColumnSchemaPart,
        value: {
            type: 'jsonb'
        }
    },
    indices: [
    ],
    relations: {
    }
})
