import { Static, Type } from '@sinclair/typebox'

export enum OnboardingStep {
    CREATED_PROJECT = 'created-project',
    MANAGED_ROLES = 'managed-roles',
    INVITED_USERS = 'invited-users',
    CREATED_AI_MODELS = 'created-ai-models',
    MANAGED_PIECES = 'managed-pieces',
    CREATED_GLOBAL_CONNECTIONS = 'created-global-connections',
    EXPLORED_ADOPTION = 'explored-adoption',
    CHECKED_HEALTH = 'checked-health',
}

export const PlatformOnboarding = Type.Object({
    [OnboardingStep.CREATED_PROJECT]: Type.Boolean(),
    [OnboardingStep.MANAGED_ROLES]: Type.Boolean(),
    [OnboardingStep.INVITED_USERS]: Type.Boolean(),
    [OnboardingStep.CREATED_AI_MODELS]: Type.Boolean(),
    [OnboardingStep.MANAGED_PIECES]: Type.Boolean(),
    [OnboardingStep.CREATED_GLOBAL_CONNECTIONS]: Type.Boolean(),
    [OnboardingStep.EXPLORED_ADOPTION]: Type.Boolean(),
    [OnboardingStep.CHECKED_HEALTH]: Type.Boolean(),
})

export type PlatformOnboarding = Static<typeof PlatformOnboarding>
