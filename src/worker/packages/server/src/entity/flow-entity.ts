import {EntitySchema} from "typeorm"
import {Flow, FlowVersion} from "shared/dist";
import {BaseColumnSchemaPart} from "../helper/base-entity";

interface FlowSchema extends Flow {
    versions: FlowVersion[];
}

export const FlowEntity = new EntitySchema<FlowSchema>({
    name: "flow",
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String
        },
        collectionId: {
            type: 'bytea',
        }
    },
    indices: [
        {
            name: 'idx_flow_collection_id',
            columns: ['collectionId'],
            unique: false
        }
    ],
    relations: {
        versions: {
            type: "one-to-many",
            target: "flow_version",
            inverseSide: 'flow'
        },
    }
})
