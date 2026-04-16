import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { clockodoAuth } from '../auth'
import absenceActions from './absence'
import customerActions from './customer'
import entryActions from './entry'
import projectActions from './project'
import serviceActions from './service'
import teamActions from './team'
import userActions from './user'

export default [
    ...entryActions,
    ...customerActions,
    ...projectActions,
    ...serviceActions,
    ...teamActions,
    ...userActions,
    ...absenceActions,
    createCustomApiCallAction({
        baseUrl: () => 'https://my.clockodo.com/api', // Replace with the actual base URL
        auth: clockodoAuth,
        authMapping: async (auth) => ({
            'X-ClockodoApiUser': auth?.props?.email || '',
            'X-ClockodoApiKey': auth?.props?.token || '',
            'X-Clockodo-External-Application': auth?.props?.company_name || '',
            'Accept-Language': 'en',
        }),
    }),
]
