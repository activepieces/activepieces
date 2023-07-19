import { AppConnectionService } from './app-connection-service'
import { DefaultAppConnectionService } from './default-app-connection-service'

export const appConnectionService: AppConnectionService = new DefaultAppConnectionService()
