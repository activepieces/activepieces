import { Permission } from '@activepieces/core-utils'
import { databaseConnection } from '../../database/database-connection'
import { FlowEntity } from '../../flows/flow/flow.entity'
import { TableEntity } from '../../tables/table/table.entity'

const resolve = async ({ resourceId, projectId }: ResolveParams): Promise<CollaborativeResource | null> => {
    const isFlow = await databaseConnection().getRepository(FlowEntity).existsBy({ id: resourceId, projectId })
    if (isFlow) {
        return { writePermission: Permission.WRITE_FLOW }
    }
    const isTable = await databaseConnection().getRepository(TableEntity).existsBy({ id: resourceId, projectId })
    if (isTable) {
        return { writePermission: Permission.WRITE_TABLE }
    }
    return null
}

export const collaborativeResource = { resolve }

export type CollaborativeResource = {
    writePermission: Permission
}

type ResolveParams = {
    resourceId: string
    projectId: string
}
