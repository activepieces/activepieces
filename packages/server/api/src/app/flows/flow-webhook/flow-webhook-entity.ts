import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../../database/database-common";
import { FlowWebhook, Project } from "@activepieces/shared";
import { Flow } from "@activepieces/shared";

type FlowWebhookSchema = FlowWebhook & {
  project: Project
  targetFlow: Flow // flow that is triggered by the webhook
  triggerFlows: Flow[] // flows that trigger the webhook when failed
}

export const FlowWebhookEntity = new EntitySchema<FlowWebhookSchema>({
    name: 'flow_webhook',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        targetFlowId: ApIdSchema,
    },
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_flow_webhook_project_id',
            },
        },
        targetFlow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'targetFlowId',
                foreignKeyConstraintName: 'fk_flow_webhook_flow_id',
            },
        },
        triggerFlows: { 
            type: 'many-to-many',
            target: 'flow',
            joinTable: {
                name: 'flow-webhook-trigger-flow',
                joinColumn: {
                    name: 'flow_webhook_id',
                    referencedColumnName: 'id',
                },
                inverseJoinColumn: {
                    name: 'flow_id',
                    referencedColumnName: 'id',
                }
            }               
        }
    }
})