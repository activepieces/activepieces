import { createAction } from '@activepieces/pieces-framework'
import { mysqlAuth } from '../..'
import { mysqlConnect, mysqlGetTableNames } from '../common'

export default createAction({
  auth: mysqlAuth,
  name: 'get_tables',
  displayName: 'Get Tables',
  description: 'Returns a list of tables in the database',
  props: {},
  async run(context) {
    const conn = await mysqlConnect(context.auth, context.propsValue)
    try {
      const tables = await mysqlGetTableNames(conn)
      return { tables }
    } finally {
      await conn.end()
    }
  },
})
