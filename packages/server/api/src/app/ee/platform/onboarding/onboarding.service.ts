import { OnboardingStep, PlatformOnboarding } from '@activepieces/ee-shared'
import { apId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { OnboardingEntity } from './onboarding.entity'

const onboardingRepo = repoFactory(OnboardingEntity)

export const onboardingService = (log: FastifyBaseLogger) => ({
    async getOnboarding(platformId: string): Promise<PlatformOnboarding> {
        const steps = await onboardingRepo().findBy({ platformId })
        const completedSteps = new Set(steps.map((s) => s.step))

        return {
            [OnboardingStep.CREATED_PROJECT]: completedSteps.has(OnboardingStep.CREATED_PROJECT),
            [OnboardingStep.MANAGED_ROLES]: completedSteps.has(OnboardingStep.MANAGED_ROLES),
            [OnboardingStep.INVITED_USERS]: completedSteps.has(OnboardingStep.INVITED_USERS),
            [OnboardingStep.CREATED_AI_MODELS]: completedSteps.has(OnboardingStep.CREATED_AI_MODELS),
            [OnboardingStep.MANAGED_PIECES]: completedSteps.has(OnboardingStep.MANAGED_PIECES),
            [OnboardingStep.CREATED_GLOBAL_CONNECTIONS]: completedSteps.has(OnboardingStep.CREATED_GLOBAL_CONNECTIONS),
            [OnboardingStep.EXPLORED_ADOPTION]: completedSteps.has(OnboardingStep.EXPLORED_ADOPTION),
            [OnboardingStep.CHECKED_HEALTH]: completedSteps.has(OnboardingStep.CHECKED_HEALTH),
        }
    },

    async completeStep(platformId: string, step: OnboardingStep): Promise<void> {
        log.info({ platformId, step }, '[OnboardingService#completeStep] Completing step')
        
        const exists = await onboardingRepo().existsBy({ platformId, step })
        if (exists) {
            return
        }

        await onboardingRepo().save({
            id: apId(),
            platformId,
            step,
        })
    },
})
