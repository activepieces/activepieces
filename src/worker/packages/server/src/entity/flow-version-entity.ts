import {EntitySchema} from "typeorm"
import {Flow, FlowVersion} from "shared/dist";
import {BaseColumnSchemaPart} from "./base-entity";

interface FlowVersionSchema extends FlowVersion {
    flow: Flow;
}

export const FlowVersionEntity = new EntitySchema<FlowVersionSchema>({
    name: "flow_version",
    columns: {
        ...BaseColumnSchemaPart,
        flowId: {
            type: 'bytea',
        },
        displayName: {
            type: String,
        },
        trigger: {
            type: 'jsonb',
        },
        valid: {
          type: Boolean
        },
        state: {
            type: String
        }
    },
    indices: [
        {
            name: 'idx_flow_version_flow_id',
            columns: ['flowId'],
            unique: false
        }
    ],
    relations: {
        flow: {
            type: 'many-to-one',
            target: 'flow',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: "fk_flow_version_flow"
            },
        },
    }
})
