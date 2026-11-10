import {
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    PropertyContext,
    StaticPropsValue,
    Store,
    TriggerStrategy,
} from '@activepieces/pieces-framework'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../../framework/src/lib/test'
import { airtableFindRecordAction } from '../../src/lib/actions/find-record'
import { airtableAuth } from '../../src/lib/auth'
import { airtableNewRecordTrigger } from '../../src/lib/trigger/new-record.trigger'
import { airtableUpdatedRecordTrigger } from '../../src/lib/trigger/update-record.trigger'

export const auth: AppConnectionValueForAuthProperty<typeof airtableAuth> = {
    type: AppConnectionType.SECRET_TEXT,
    secret_text: 'patTestToken',
}

export const newRecordTrigger = newRecordPolling()
export const updatedRecordTrigger = updatedRecordPolling()

export function newRecordContext({ store, propsValue, isRepublish }: {
    store: Store
    propsValue: StaticPropsValue<typeof newRecordTrigger.props>
    isRepublish?: boolean
}) {
    return {
        ...createMockPollingTriggerContext<typeof newRecordTrigger.props>({ propsValue }),
        auth,
        store,
        isRepublish,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

export function updatedRecordContext({ store, propsValue, isRepublish }: {
    store: Store
    propsValue: StaticPropsValue<typeof updatedRecordTrigger.props>
    isRepublish?: boolean
}) {
    return {
        ...createMockPollingTriggerContext<typeof updatedRecordTrigger.props>({ propsValue }),
        auth,
        store,
        isRepublish,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

export function findRecordContext({ propsValue }: { propsValue: StaticPropsValue<typeof airtableFindRecordAction.props> }) {
    return {
        ...createMockActionContext<typeof airtableFindRecordAction.props>({ propsValue }),
        auth,
    }
}

export function propertyContext(): PropertyContext {
    const { server, project, flows, connections } = createMockActionContext({ propsValue: {} })
    return { server, project, flows, connections }
}

function newRecordPolling() {
    if (airtableNewRecordTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return airtableNewRecordTrigger
}

function updatedRecordPolling() {
    if (airtableUpdatedRecordTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return airtableUpdatedRecordTrigger
}
