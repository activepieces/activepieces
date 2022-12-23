import {EntitySchema} from "typeorm"
import {File} from "shared/dist/model/file";
import {BaseColumnSchemaPart} from "../helper/base-entity";

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
