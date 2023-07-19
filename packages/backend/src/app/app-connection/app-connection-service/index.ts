import { AppConnectionService } from './app-connection-service'
import { OssAppConnectionService } from './oss-app-connection-service'

export const appConnectionService: AppConnectionService = new OssAppConnectionService()
