import { createAction } from '@activepieces/pieces-framework'
import { QdrantClient } from '@qdrant/js-client-rest'
import { qdrantAuth } from '../..'
import { collectionName } from '../common'

export const deleteCollection = createAction({
  auth: qdrantAuth,
  name: 'delete_collection',
  displayName: 'Delete Collection',
  description: 'Delete a collection of your database',
  props: {
    collectionName,
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.key,
      url: auth.serverAddress,
    })
    const collectionName = propsValue.collectionName as string
    const response = await client.deleteCollection(collectionName)
    return response
  },
})
