import { Static, Type } from '@sinclair/typebox'

export const Metadata = Type.Record(Type.String(), Type.Unknown())
export type Metadata = Static<typeof Metadata> 