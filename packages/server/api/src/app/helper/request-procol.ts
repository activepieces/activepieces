import axios from 'axios'
 import { SystemProp, logger, system } from 'server-shared'

 export type RequestPayloadProcol = {
     endpoint: string
     method: 'GET' | 'POST' | 'PUT' | 'DELETE'
     headers?: Record<string, string>
     body?: object
     params?: object
 }

 export const requestProcol = async (payload: RequestPayloadProcol): Promise<any> => {
     const { endpoint, method, headers, body, params } = payload

     logger.info('===================PING PROCOL================')

     try {
         const response = await axios({
             method,
             baseURL: system.get(SystemProp.PROCOL_BASE_URL),
             url: endpoint,
             headers: {
                 ...headers,
                 'access-token': system.get(SystemProp.PROCOL_AUTH_TOKEN),
             },
             data: body,
             params,
         })  
         return response
     }
     catch (error) {
         logger.error(error)
     }
 } 