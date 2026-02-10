import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, UserIdentityProvider } from '@activepieces/shared'
import { authenticationService } from '../../authentication/authentication.service'
import { FlagEntity } from '../../flags/flag.entity'
import { system } from '../../helper/system/system'
import { databaseConnection } from '../database-connection'
import { DataSeed } from './data-seed'

const DEV_DATA_SEEDED_FLAG = 'DEV_DATA_SEEDED'
const log = system.globalLogger()

const currentEnvIsNotDev = (): boolean => {
    const env = system.get(AppSystemProp.ENVIRONMENT)
    const edition = system.get(AppSystemProp.EDITION)
    return env !== ApEnvironment.DEVELOPMENT  || edition === ApEdition.ENTERPRISE
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


    await authenticationService(log).signUp({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        firstName: 'Dev',
        lastName: 'User',
        trackEvents: false,
        platformId: null,
        newsLetter: false,
        provider: UserIdentityProvider.EMAIL,
    })

    log.info({ name: 'seedDevUser' }, `email=${DEV_EMAIL} pass=${DEV_PASSWORD}`)
}
const seedDevData = async (): Promise<void> => {
    if (currentEnvIsNotDev()) {
        log.info({ name: 'seedDevData' }, 'skip: not in development environment')
        return
    }

    if (await devDataAlreadySeeded()) {
        log.info({ name: 'seedDevData' }, 'skip: already seeded')
        return
    }

    await seedDevUser()
    await setDevDataSeededFlag()
}

export const devDataSeed: DataSeed = {
    run: seedDevData,
}
