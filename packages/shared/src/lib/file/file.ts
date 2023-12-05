import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { FileType } from './file-type'
import { FileCompression } from './file-compression'
import { Static, Type } from '@sinclair/typebox'

export type FileId = ApId

export const File = Type.Object({
    ...BaseModelSchema,
    projectId: Type.Optional(Type.String()),
    platformId: Type.Optional(Type.String()),
    type: Type.Enum(FileType),
    compression: Type.Enum(FileCompression),
    data: Type.Unknown(),

})
export type File = Static<typeof File> & {
    data: Buffer
}