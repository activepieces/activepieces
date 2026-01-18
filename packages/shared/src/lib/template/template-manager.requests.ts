import { Static, Type } from '@sinclair/typebox'

export const InstallTemplateRequestBody = Type.Object({
    userId: Type.String(),
})
export type InstallTemplateRequestBody = Static<typeof InstallTemplateRequestBody>

export const SetStatusTemplateRequestBody = Type.Object({
    flowId: Type.String(),
    status: Type.Boolean(),
})
export type SetStatusTemplateRequestBody = Static<typeof SetStatusTemplateRequestBody>

export const ClickExploreButtonRequestBody = Type.Object({
    userId: Type.String(),
})
export type ClickExploreButtonRequestBody = Static<typeof ClickExploreButtonRequestBody>