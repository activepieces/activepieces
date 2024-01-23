import { Static, Type } from '@sinclair/typebox'

export const ExecuteCodeRequest = Type.Object({
    artifact: Type.String(),
    input: Type.Object({}),
})

export type ExecuteCodeRequest = Static<typeof ExecuteCodeRequest>
