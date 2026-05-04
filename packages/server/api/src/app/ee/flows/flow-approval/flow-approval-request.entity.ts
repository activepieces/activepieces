import { Flow, FlowApprovalRequest, FlowApprovalRequestState, FlowVersion, Platform, Project, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export type FlowApprovalRequestSchema = FlowApprovalRequest & {
    flow: Flow
    flowVersion: FlowVersion
    project: Project
    platform: Platform
    submitter: User | null
    approver: User | null
}

export const FlowApprovalRequestEntity = new EntitySchema<FlowApprovalRequestSchema>({
    name: 'flow_approval_request',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: {
            ...ApIdSchema,
            nullable: false,
        },
        flowVersionId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        submitterId: {
            ...ApIdSchema,
            nullable: true,
        },
        submittedAt: {
            type: 'timestamp with time zone',
            nullable: false,
        },
        approverId: {
            ...ApIdSchema,
            nullable: true,
        },
        decidedAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        state: {
            type: String,
            enum: FlowApprovalRequestState,
            nullable: false,
        },
        requestedStatus: {
            type: String,
            nullable: false,
        },
        rejectionReason: {
            type: 'text',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_flow_approval_request_flow_version_id',
            columns: ['flowVersionId'],
            unique: true,
        },
        {
            name: 'idx_flow_approval_request_project_id_state',
            columns: ['projectId', 'state'],
        },
        {
            name: 'idx_flow_approval_request_platform_id',
            columns: ['platformId'],
        },
    ],
    relations: {
        flow: {
            type: 'many-to-one',
            target: 'flow',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_flow_approval_request_flow_id',
            },
        },
        flowVersion: {
            type: 'many-to-one',
            target: 'flow_version',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowVersionId',
                foreignKeyConstraintName: 'fk_flow_approval_request_flow_version_id',
            },
        },
        submitter: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'SET NULL',
            nullable: true,
            joinColumn: {
                name: 'submitterId',
                foreignKeyConstraintName: 'fk_flow_approval_request_submitter_id',
            },
        },
        approver: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'SET NULL',
            nullable: true,
            joinColumn: {
                name: 'approverId',
                foreignKeyConstraintName: 'fk_flow_approval_request_approver_id',
            },
        },
    },
})
