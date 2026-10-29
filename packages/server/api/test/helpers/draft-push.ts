import { WebsocketClientEvent } from '@activepieces/shared'
import { vi } from 'vitest'
import { websocketService } from '../../src/app/core/websockets.service'

function capture(): DraftPush[] {
    const pushes: DraftPush[] = []
    observe((push) => {
        pushes.push(push)
    })
    return pushes
}

function observe(onPush: (push: DraftPush) => void): void {
    const realTo = websocketService.to
    vi.spyOn(websocketService, 'to').mockImplementation((room) => {
        const operator = realTo(room)
        vi.spyOn(operator, 'emit').mockImplementation((event, ...args) => {
            if (event === WebsocketClientEvent.FLOW_DRAFT_UPDATED) {
                onPush({ room, payload: args[0] })
            }
            return true
        })
        return operator
    })
}

export const draftPushes = { capture, observe }

export type DraftPush = {
    room: string
    payload: unknown
}
