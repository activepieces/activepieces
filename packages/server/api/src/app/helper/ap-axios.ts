import { safeHttp } from '@activepieces/server-utils'
import { isNil } from '@activepieces/shared'
import { AxiosError } from 'axios'
import axiosRetry from 'axios-retry'


export const apAxios = safeHttp.createAxios({
    baseURL: 'https://api.activepieces.com',
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosRetry(apAxios, {
    retryDelay: (_retryCount: number) => {
        return 2000
    },
    retries: 3,
    retryCondition: (error: AxiosError) => {
        return !isNil(error.response?.status) && error.response.status >= 500 && error.response.status < 600
    },
})
