import {EntitySchema} from "typeorm"
import {ApIdSchema, BaseColumnSchemaPart} from "../helper/base-entity";
import {File} from "shared";

interface FileSchema extends File {

}

export const FileEntity = new EntitySchema<FileSchema>({
    name: "file",
    columns: {
        ...BaseColumnSchemaPart,
        contentType: {
            type: String,
        },
        data: ApIdSchema,
        size: {
            type: Number,
        },
    }
})
