import {EntitySchema} from "typeorm"
import {BaseColumnSchemaPart} from "./base-entity";
import {File} from "shared/dist/model/file";

interface FileSchema extends File {

}

export const FileEntity = new EntitySchema<FileSchema>({
    name: "file",
    columns: {
        ...BaseColumnSchemaPart,
        contentType: {
            type: String,
        },
        data: {
            type: 'bytea',
        },
        size: {
            type: Number,
        },
    }
})
