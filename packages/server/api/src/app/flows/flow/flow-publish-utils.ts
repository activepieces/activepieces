import { FlowTriggerType, FlowVersion } from '@activepieces/shared'
import deepEqual from 'deep-equal'

function isSameTrigger({ published, toPublish }: IsSameTriggerParams): boolean {
    return published.type === FlowTriggerType.PIECE
        && toPublish.type === FlowTriggerType.PIECE
        && published.settings.pieceName === toPublish.settings.pieceName
        && published.settings.triggerName === toPublish.settings.triggerName
        && deepEqual(published.settings.input, toPublish.settings.input)
}

export const flowPublishUtils = { isSameTrigger }

type IsSameTriggerParams = {
    published: FlowVersion['trigger']
    toPublish: FlowVersion['trigger']
}
