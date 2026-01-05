import { BadgeCheck } from '../badge-check'
import { flowsBadgesCheck } from './active-flows-badges'
import { flowContentBadgesCheck } from './flow-content'
import { flowRunsBadgesCheck } from './flow-runs-badges'

export const allBadges: BadgeCheck[] = [
    flowsBadgesCheck,
    flowContentBadgesCheck,
    flowRunsBadgesCheck,
]
