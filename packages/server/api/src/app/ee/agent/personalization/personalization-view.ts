import {
    ChatPersonalization,
    ChatPersonalizationProgressEvent,
    ChatPersonalizationScope,
    ChatPersonalizationStatus,
    ChatPersonalizationView,
    PersonalizationPrefill,
    PersonalizationScope,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { websocketService } from '../../../core/websockets.service'

export function toView({ row, scope, inputsRow, role, personalStatus, prefill }: {
    row: ChatPersonalization
    scope: ChatPersonalizationScope
    inputsRow: ChatPersonalization
    role: string | null
    personalStatus: ChatPersonalizationStatus
    prefill: PersonalizationPrefill | null
}): ChatPersonalizationView {
    return {
        status: row.status,
        personalStatus,
        scope,
        useCases: row.useCases ?? [],
        profile: row.profile ?? null,
        companyInput: inputsRow.companyText ?? inputsRow.domain ?? null,
        roleInput: role,
        prefill,
    }
}


export function toScopeEnum(scope: PersonalizationScope): ChatPersonalizationScope {
    return scope === 'user' ? ChatPersonalizationScope.USER : ChatPersonalizationScope.COMPANY
}


export function emitProgress({ userId, event }: { userId: string, event: ChatPersonalizationProgressEvent }): void {
    websocketService.to(userId).emit(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, event)
}


export type PersonalizationIdentity = {
    company: PersonalizationIdentityCompany | null
    role: string | null
}


export type PersonalizationIdentityCompany = {
    name: string
    description: string
    industry: string
}

