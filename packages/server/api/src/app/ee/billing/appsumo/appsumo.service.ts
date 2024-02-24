import { databaseConnection } from '../../../database/database-connection'
import { AppSumoEntity, AppSumoPlan } from './appsumo.entity'

const appsumoRepo = databaseConnection.getRepository(AppSumoEntity)

type FlowPlanLimits = {
    nickname: string
    tasks: number
    minimumPollingInterval: number
    connections: number
    teamMembers: number
}

const appSumoPlans: Record<string, FlowPlanLimits> = {
    activepieces_tier1: {
        nickname: 'appsumo_activepieces_tier1',
        tasks: 10000,
        minimumPollingInterval: 10,
        connections: 100,
        teamMembers: 1,
    },
    activepieces_tier2: {
        nickname: 'appsumo_activepieces_tier2',
        tasks: 50000,
        minimumPollingInterval: 5,
        connections: 100,
        teamMembers: 1,
    },
    activepieces_tier3: {
        nickname: 'appsumo_activepieces_tier3',
        tasks: 200000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
    activepieces_tier4: {
        nickname: 'appsumo_activepieces_tier4',
        tasks: 500000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
    activepieces_tier5: {
        nickname: 'appsumo_activepieces_tier5',
        tasks: 1000000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
}

export const appsumoService = {
    getPlanInformation(plan_id: string) {
        return appSumoPlans[plan_id]
    },
    getByEmail(email: string) {
        return appsumoRepo.findOneBy({
            activation_email: email,
        })
    },
    getById(uuid: string) {
        return appsumoRepo.findOneBy({
            uuid,
        })
    },
    delete({ email }: { email: string }) {
        return appsumoRepo.delete({
            activation_email: email,
        })
    },
    upsert(plan: AppSumoPlan) {
        return appsumoRepo.upsert(plan, ['uuid'])
    },
}
