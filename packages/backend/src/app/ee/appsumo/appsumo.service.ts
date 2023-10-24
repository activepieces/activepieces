import { databaseConnection } from '../../database/database-connection'
import { FlowPlanLimits, PlanType } from '../billing/plans/pricing-plans'
import { AppSumoEntity, AppSumoPlan } from './appsumo.entity'


const appsumoRepo = databaseConnection.getRepository(AppSumoEntity)

const appSumoPlans: Record<string, FlowPlanLimits> = {
    'activepieces_tier1': {
        nickname: 'appsumo_activepieces_tier1',
        tasks: 10000,
        type: PlanType.FLOWS,
        minimumPollingInterval: 10,
        connections: 20,
        tasksPerDay: null,
        teamMembers: 1,
        activeFlows: 100,
    },
    'activepieces_tier2': {
        nickname: 'appsumo_activepieces_tier2',
        tasks: 50000,
        type: PlanType.FLOWS,
        minimumPollingInterval: 5,
        connections: 100,
        tasksPerDay: null,
        teamMembers: 1,
        activeFlows: 100,
    },
    'activepieces_tier3': {
        nickname: 'appsumo_activepieces_tier3',
        type: PlanType.FLOWS,
        tasks: 200000,
        minimumPollingInterval: 1,
        connections: 100,
        tasksPerDay: null,
        teamMembers: 5,
        activeFlows: 100,
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
    delete(uuid: string) {
        return appsumoRepo.delete({
            uuid,
        })
    },
    upsert(plan: AppSumoPlan) {
        return appsumoRepo.upsert(plan, ['uuid'])
    },
}