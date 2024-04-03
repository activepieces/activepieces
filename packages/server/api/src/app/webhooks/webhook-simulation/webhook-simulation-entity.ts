import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { WebhookSimulation } from '@activepieces/shared'

export type WebhookSimulationSchema = WebhookSimulation

export const WebhookSimulationEntity =
  new EntitySchema<WebhookSimulationSchema>({
      name: 'webhook_simulation',
      columns: {
          ...BaseColumnSchemaPart,
          flowId: ApIdSchema,
          projectId: ApIdSchema,
      },
      indices: [
          {
              name: 'idx_webhook_simulation_flow_id',
              columns: ['flowId'],
              unique: true,
          },
      ],
  })
