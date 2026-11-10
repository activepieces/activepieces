import { hooksFactory } from '../helper/hooks-factory'

export const userInvitationHooks = hooksFactory.create<UserInvitationHooks>(() => ({
    async onInvitedUserJoined(): Promise<void> {
        return
    },
}))

export type InvitedUserJoinedParams = {
    platformId: string
    userId: string
}

export type UserInvitationHooks = {
    onInvitedUserJoined(params: InvitedUserJoinedParams): Promise<void>
}
