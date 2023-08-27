import { pdf } from '@activepieces/piece-pdf'
import { faissEmbedding } from '@activepieces/chatbots'

const piecesWithDataSource = [pdf]

export const datasourceService = {
    async syncDatasource({
        propsValue,
        datasourceId,
        botId,
        auth,
    }: {
        propsValue: Record<string, unknown>
        botId: string
        datasourceId: string
        auth: string | undefined
    }) {
        const datasource = piecesWithDataSource[0].datasources()['from-file']
        const docs = await datasource.sync({
            auth,
            propsValue,
        })
        const embedding = faissEmbedding({
            botId,
            // TODO FIX
            openAIApiKey: auth!,
        })
        await embedding.addDocuments({
            datasourceId,
            documents: docs,
        })
    },
    async deleteDataSource({
        datasourceId,
        botId,
    }: {
        botId: string
        datasourceId: string
    }) {
        const embedding = faissEmbedding({
            botId,
            // TODO FIX
            openAIApiKey: '',
        })
        await embedding.deleteDocuments({
            datasourceId,
        })
    },
}

