import { Flow, Mcp, McpFlow } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'


type McpFlowSchema = McpFlow & {
    mcp: Mcp
    flow: Flow
}

export const McpFlowEntity = new EntitySchema<McpFlowSchema>({
    name: 'mcp_flow',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: ApIdSchema,
        mcpId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_mcp_flow_flow_id',
            columns: ['flowId'],
        },
        {
            name: 'idx_mcp_flow_mcp_id_flow_id',
            columns: ['mcpId', 'flowId'],
            unique: true,
        },
    ],
    relations: {
        mcp: {
            type: 'many-to-one',
            target: 'mcp',
            joinColumn: {
                name: 'mcpId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_flow_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_flow_flow_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})