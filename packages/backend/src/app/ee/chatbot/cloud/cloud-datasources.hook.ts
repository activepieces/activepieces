import { DatasourceHooks } from '../../../chatbot/datasources/datasource.hooks'
import { botsLimits } from '../../billing/limits/bots-limits'


export const cloudDatasourceHooks: DatasourceHooks = {
    async preSave({ projectId }) {
        await botsLimits.limitDatasourcesSize({ projectId })
    },
}

