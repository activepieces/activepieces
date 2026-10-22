import { FlowVersion } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from './flow-version-entity'

const flowVersionRepo = repoFactory(FlowVersionEntity)

async function updateTriggerIfUnchanged({ flowVersion, newTrigger }: UpdateTriggerIfUnchangedParams): Promise<boolean> {
    const updateResult = await flowVersionRepo().createQueryBuilder()
        .update()
        .set({ trigger: newTrigger })
        .where('id = :id', { id: flowVersion.id })
        .andWhere('trigger = CAST(:snapshot AS jsonb)', { snapshot: JSON.stringify(flowVersion.trigger) })
        .returning(['id'])
        .execute()
    return updateResult.raw?.length === 1
}

export const flowVersionTriggerUtil = { updateTriggerIfUnchanged }

type UpdateTriggerIfUnchangedParams = {
    flowVersion: FlowVersion
    newTrigger: FlowVersion['trigger']
}
