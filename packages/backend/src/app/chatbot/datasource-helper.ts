import { pdf } from '@activepieces/piece-pdf'
import { faissEmbedding } from '@activepieces/chatbots'

const piecesWithDataSource = [pdf]

export const syncDatasource = async ({
    propsValue,
    datasourceId,
    botId,
    auth,
}: {
    propsValue: Record<string, unknown>
    botId: string
    datasourceId: string
    auth: string | undefined
}) => {
    // TODO Make it find the datasource from source name and piece name
    const datasource = piecesWithDataSource[0].datasources()['from-file']
    const docs = await datasource.sync({
        auth,
        propsValue,
    })
    const embedding = await faissEmbedding(botId)
    await embedding.addDocuments({
        datasourceId,
        documents: docs,
    })
}


export const deleteDataSource = async ({
  datasourceId,
  botId,
}: {
  botId: string
  datasourceId: string
}) => {
  const embedding = await faissEmbedding(botId)
  await embedding.deleteDocuments({
      datasourceId
  })
}

