import { JSONSchema, Schema } from "effect"

import type { BlobId } from "./shared.js"
import { MimeType, NonEmptyString } from "./shared.js"

const UploadFileParamsBase = Schema.Struct({
  filename: NonEmptyString.annotations({
    description: "Name of the file (e.g., 'screenshot.png')"
  }),
  contentType: MimeType.annotations({
    description: "MIME type of the file (e.g., 'image/png', 'application/pdf')"
  }),
  filePath: Schema.optional(Schema.String.annotations({
    description: "Local file path to upload (preferred - avoids context flooding)"
  })),
  fileUrl: Schema.optional(Schema.String.annotations({
    description: "URL to fetch file from (for remote files)"
  })),
  data: Schema.optional(Schema.String.annotations({
    description: "Base64-encoded file data (fallback for small files <10KB)"
  }))
})

export const UploadFileParamsSchema = UploadFileParamsBase.pipe(
  Schema.filter((params) => {
    const hasSource = params.filePath || params.fileUrl || params.data
    return hasSource ? true : "Must provide filePath, fileUrl, or data"
  })
).annotations({
  title: "UploadFileParams",
  description:
    "Parameters for uploading a file. Provide ONE of: filePath (local file), fileUrl (remote URL), or data (base64, for small files only)"
})

export type UploadFileParams = Schema.Schema.Type<typeof UploadFileParamsSchema>

// No codec needed — internal type, not used for runtime validation
export interface UploadFileResult {
  readonly blobId: BlobId
  readonly contentType: string
  readonly size: number
  readonly url: string
}

export const uploadFileParamsJsonSchema = JSONSchema.make(UploadFileParamsSchema)

export const parseUploadFileParams = Schema.decodeUnknown(UploadFileParamsSchema)
