import { ApId, AppConnectionWithoutSensitiveData, BaseModelSchema } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const MCP = Type.Object({
  ...BaseModelSchema,
  projectId: ApId,
  token: ApId,
})

export type MCP = Static<typeof MCP>

export type MCPSchema = MCP & {
  connections: AppConnectionWithoutSensitiveData[]
}
