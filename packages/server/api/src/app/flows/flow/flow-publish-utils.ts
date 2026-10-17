import { isNil } from '@activepieces/core-utils'
import { FlowStatus, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import deepEqual from 'deep-equal'

function isSameTrigger({ published, toPublish }: IsSameTriggerParams): boolean {
    return published.type === FlowTriggerType.PIECE
        && toPublish.type === FlowTriggerType.PIECE
        && published.settings.pieceName === toPublish.settings.pieceName
        && published.settings.triggerName === toPublish.settings.triggerName
        && deepEqual(published.settings.input, toPublish.settings.input)
}

function isRepublish({ previouslyPublished, toPublish, requestedStatus }: IsRepublishParams): boolean {
    return !isNil(previouslyPublished)
        && requestedStatus === FlowStatus.ENABLED
        && isSameTrigger({ published: previouslyPublished.trigger, toPublish: toPublish.trigger })
}

export const flowPublishUtils = { isSameTrigger, isRepublish }

type IsSameTriggerParams = {
    published: FlowVersion['trigger']
    toPublish: FlowVersion['trigger']
}

type IsRepublishParams = {
    previouslyPublished: FlowVersion | undefined
    toPublish: FlowVersion
    requestedStatus: FlowStatus
}
