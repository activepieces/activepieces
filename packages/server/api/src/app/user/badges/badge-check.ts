import { ApplicationEvent } from '@activepieces/ee-shared'
import { BADGES } from '@activepieces/shared'

export type BadgeCheckResult = {
    userId: string | null
    badges: (keyof typeof BADGES)[]
}

export type BadgeCheck = {
    eval: (applicationEvent: ApplicationEvent) => Promise<BadgeCheckResult>
}
