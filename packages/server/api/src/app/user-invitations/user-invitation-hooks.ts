import { hooksFactory } from '../helper/hooks-factory'

export const userInvitationHooks = hooksFactory.create<UserInvitationHooks>(() => ({
    async onInvitedUserJoined(): Promise<void> {
        return
    },
}))

export type InvitedUserJoinedParams = {
    platformId: string
    identityId: string
}

export type UserInvitationHooks = {
    onInvitedUserJoined(params: InvitedUserJoinedParams): Promise<void>
}
