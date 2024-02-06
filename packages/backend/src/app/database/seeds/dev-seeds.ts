import { ApEnvironment } from '@activepieces/shared'
import { authenticationService } from '../../authentication/authentication-service'
import { logger } from '../../helper/logger'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { userService } from '../../user/user-service'
import { Provider } from '../../authentication/authentication-service/hooks/authentication-service-hooks'

const seedDevUser = async (): Promise<void> => {
    const devEmail = 'dev@ap.com'
    const devPassword = '12345678'
    const devUser = await userService.getByPlatformAndEmail({
        platformId: null,
        email: devEmail,
    })

    if (!devUser) {
        await authenticationService.signUp({
            email: devEmail,
            password: devPassword,
            firstName: 'firstName',
            lastName: 'lastName',
            trackEvents: false,
            newsLetter: false,
            verified: true,
            platformId: null,
            provider: Provider.EMAIL,
        })
    }

    logger.info(`[seedDevUser] email=${devEmail} pass=${devPassword}`)
}

export const seedDevData = async (): Promise<void> => {

    const env = system.get(SystemProp.ENVIRONMENT)

    if (env !== ApEnvironment.DEVELOPMENT) {
        logger.info('[seedDevData] skip seeding dev data')
        return
    }

    logger.info('[seedDevData] seeding dev data')

    await seedDevUser()
}
