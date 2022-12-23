import {EntitySchema} from "typeorm"
import {ApIdSchema, BaseColumnSchemaPart} from "../helper/base-entity";
import {InstanceRun} from "shared";
import {BaseColumnSchemaPart} from "./base-entity";
import {File} from "shared/dist/model/file";

interface InstanceRunSchema extends InstanceRun {

}

export const InstanceRunEntity = new EntitySchema<InstanceRunSchema>({
    name: "instance_run",
    columns: {
        ...BaseColumnSchemaPart,
        instanceId: ApIdSchema,
        projectId: ApIdSchema,
        collectionId: ApIdSchema,
        flowVersionId: ApIdSchema,
        collectionVersionId: ApIdSchema,
        flowDisplayName: {
            type: String,
        },
        collectionDisplayName: {
            type: String,
        },
        logsFileId: ApIdSchema,
        logsFileId: {
            type: 'bytea',
        },
        status: {
            type: String,
        },
        startTime: {
            type: Number,
        },
        finishTime: {
            type: Number,
        },
    },
    indices: [
        {
            name: 'idx_run_project_id',
            columns: ['projectId'],
            unique: false,
        },
        {
            name: 'idx_run_instance_id',
            columns: ['instanceId'],
            unique: true,
        }
    ],
})
