import { HttpMethod } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { salesforceAuth } from '../..'
import { salesforcesCommon } from '../common'
import { querySalesforceApi } from '../common'

export const runQuery = createAction({
  auth: salesforceAuth,
  name: 'run_query',
  displayName: 'Run Query (Advanced)',
  description: 'Run a salesforce query',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Enter the query',
      required: true,
    }),
  },
  async run(context) {
    const { query } = context.propsValue
    const response = await await querySalesforceApi<{
      records: { CreatedDate: string }[]
    }>(HttpMethod.GET, context.auth, query)
    return response
  },
})
