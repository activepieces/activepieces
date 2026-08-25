import { system } from '../../helper/system/system'
import { knowledgeBaseSchema } from '../../knowledge-base/knowledge-base-schema'
import { DataSeed } from './data-seed'

export const knowledgeBaseSeed: DataSeed = {
    run: async () => {
        await knowledgeBaseSchema.ensure(system.globalLogger())
    },
}
