import { logger, SharedSystemProp, system } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { authenticationService } from '../../authentication/authentication-service'
import { Provider } from '../../authentication/authentication-service/hooks/authentication-service-hooks'
import { FlagEntity } from '../../flags/flag.entity'
import { databaseConnection } from '../database-connection'
import { DataSeed } from './data-seed'

const DEV_DATA_SEEDED_FLAG = 'DEV_DATA_SEEDED'

const currentEnvIsNotDev = (): boolean => {
    const env = system.get(SharedSystemProp.ENVIRONMENT)
    return env !== ApEnvironment.DEVELOPMENT
}

const devDataAlreadySeeded = async (): Promise<boolean> => {
    const flagRepo = databaseConnection().getRepository(FlagEntity)
    const devSeedsFlag = await flagRepo.findOneBy({ id: DEV_DATA_SEEDED_FLAG })
    return devSeedsFlag?.value === true
}

const setDevDataSeededFlag = async (): Promise<void> => {
    const flagRepo = databaseConnection().getRepository(FlagEntity)

    await flagRepo.save({
        id: DEV_DATA_SEEDED_FLAG,
        value: true,
    })
}

const seedDevUser = async (): Promise<void> => {
    const DEV_EMAIL = 'dev@ap.com'
    const DEV_PASSWORD = '12345678'


    await authenticationService.signUp({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        firstName: 'Dev',
        lastName: 'User',
        trackEvents: false,
        newsLetter: false,
        verified: true,
        platformId: null,
        provider: Provider.EMAIL,
    })

    logger.info({ name: 'seedDevUser' }, `email=${DEV_EMAIL} pass=${DEV_PASSWORD}`)
}
const seedDevData = async (): Promise<void> => {
    if (currentEnvIsNotDev()) {
        logger.info({ name: 'seedDevData' }, 'skip: not in development environment')
        return
    }

    if (await devDataAlreadySeeded()) {
        logger.info({ name: 'seedDevData' }, 'skip: already seeded')
        return
    }

    await seedDevUser()
    await setDevDataSeededFlag()
}

export const devDataSeed: DataSeed = {
    run: seedDevData,
}
