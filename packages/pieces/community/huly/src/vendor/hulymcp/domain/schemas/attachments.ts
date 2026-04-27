import { JSONSchema, Schema } from "effect"

import type { BlobId } from "./shared.js"
import {
  AttachmentId,
  DocumentIdentifier,
  IssueIdentifier,
  LimitParam,
  MimeType,
  NonEmptyString,
  ObjectClassName,
  ProjectIdentifier,
  SpaceId,
  TeamspaceIdentifier
} from "./shared.js"

// No codec needed — internal type, not used for runtime validation
export interface AttachmentSummary {
  readonly id: AttachmentId
  readonly name: string
  readonly type: string
  readonly size: number
  readonly pinned?: boolean | undefined
  readonly description?: string | undefined
  readonly modifiedOn?: number | undefined
}

export interface Attachment {
  readonly id: AttachmentId
  readonly name: string
  readonly type: string
  readonly size: number
  readonly pinned?: boolean | undefined
  readonly readonly?: boolean | undefined
  readonly description?: string | undefined
  readonly url?: string | undefined
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export const ListAttachmentsParamsSchema = Schema.Struct({
  objectId: NonEmptyString.annotations({
    description: "ID of the parent object (issue, document, etc.)"
  }),
  objectClass: ObjectClassName.annotations({
    description: "Class of the parent object (e.g., 'tracker:class:Issue', 'document:class:Document')"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of attachments to return (default: 50)"
    })
  )
}).annotations({
  title: "ListAttachmentsParams",
  description: "Parameters for listing attachments on an object"
})

export type ListAttachmentsParams = Schema.Schema.Type<typeof ListAttachmentsParamsSchema>

export const GetAttachmentParamsSchema = Schema.Struct({
  attachmentId: AttachmentId.annotations({
    description: "Attachment ID"
  })
}).annotations({
  title: "GetAttachmentParams",
  description: "Parameters for getting a single attachment"
})

export type GetAttachmentParams = Schema.Schema.Type<typeof GetAttachmentParamsSchema>

const FileSourceFields = {
  filename: NonEmptyString.annotations({
    description: "Name of the file"
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
  })),
  description: Schema.optional(Schema.String.annotations({
    description: "Attachment description"
  })),
  pinned: Schema.optional(Schema.Boolean.annotations({
    description: "Whether to pin the attachment (default: false)"
  }))
}

const hasFileSource = (params: {
  readonly filePath?: string | undefined
  readonly fileUrl?: string | undefined
  readonly data?: string | undefined
}) => {
  const hasSource = params.filePath || params.fileUrl || params.data
  return hasSource ? true : "Must provide filePath, fileUrl, or data"
}

const AddAttachmentParamsBase = Schema.Struct({
  objectId: NonEmptyString.annotations({
    description: "ID of the parent object (issue, document, etc.)"
  }),
  objectClass: ObjectClassName.annotations({
    description: "Class of the parent object (e.g., 'tracker:class:Issue', 'document:class:Document')"
  }),
  space: SpaceId.annotations({
    description: "Space ID where the parent object resides"
  }),
  ...FileSourceFields
})

export const AddAttachmentParamsSchema = AddAttachmentParamsBase.pipe(
  Schema.filter(hasFileSource)
).annotations({
  title: "AddAttachmentParams",
  description: "Parameters for adding an attachment. Provide ONE of: filePath, fileUrl, or data"
})

export type AddAttachmentParams = Schema.Schema.Type<typeof AddAttachmentParamsSchema>

export const UpdateAttachmentParamsSchema = Schema.Struct({
  attachmentId: AttachmentId.annotations({
    description: "Attachment ID"
  }),
  description: Schema.optional(
    Schema.NullOr(Schema.String).annotations({
      description: "New description (null to clear)"
    })
  ),
  pinned: Schema.optional(Schema.Boolean.annotations({
    description: "Pin or unpin the attachment"
  }))
}).annotations({
  title: "UpdateAttachmentParams",
  description: "Parameters for updating an attachment"
})

export type UpdateAttachmentParams = Schema.Schema.Type<typeof UpdateAttachmentParamsSchema>

export const DeleteAttachmentParamsSchema = Schema.Struct({
  attachmentId: AttachmentId.annotations({
    description: "Attachment ID to delete"
  })
}).annotations({
  title: "DeleteAttachmentParams",
  description: "Parameters for deleting an attachment"
})

export type DeleteAttachmentParams = Schema.Schema.Type<typeof DeleteAttachmentParamsSchema>

export const PinAttachmentParamsSchema = Schema.Struct({
  attachmentId: AttachmentId.annotations({
    description: "Attachment ID"
  }),
  pinned: Schema.Boolean.annotations({
    description: "Whether to pin (true) or unpin (false)"
  })
}).annotations({
  title: "PinAttachmentParams",
  description: "Parameters for pinning/unpinning an attachment"
})

export type PinAttachmentParams = Schema.Schema.Type<typeof PinAttachmentParamsSchema>

export const DownloadAttachmentParamsSchema = Schema.Struct({
  attachmentId: AttachmentId.annotations({
    description: "Attachment ID"
  })
}).annotations({
  title: "DownloadAttachmentParams",
  description: "Parameters for getting attachment download URL"
})

export type DownloadAttachmentParams = Schema.Schema.Type<typeof DownloadAttachmentParamsSchema>

const AddIssueAttachmentParamsBase = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue identifier (e.g., 'HULY-123')"
  }),
  ...FileSourceFields
})

export const AddIssueAttachmentParamsSchema = AddIssueAttachmentParamsBase.pipe(
  Schema.filter(hasFileSource)
).annotations({
  title: "AddIssueAttachmentParams",
  description: "Parameters for adding an attachment to an issue"
})

export type AddIssueAttachmentParams = Schema.Schema.Type<typeof AddIssueAttachmentParamsSchema>

const AddDocumentAttachmentParamsBase = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  document: DocumentIdentifier.annotations({
    description: "Document title or ID"
  }),
  ...FileSourceFields
})

export const AddDocumentAttachmentParamsSchema = AddDocumentAttachmentParamsBase.pipe(
  Schema.filter(hasFileSource)
).annotations({
  title: "AddDocumentAttachmentParams",
  description: "Parameters for adding an attachment to a document"
})

export type AddDocumentAttachmentParams = Schema.Schema.Type<typeof AddDocumentAttachmentParamsSchema>

export const listAttachmentsParamsJsonSchema = JSONSchema.make(ListAttachmentsParamsSchema)
export const getAttachmentParamsJsonSchema = JSONSchema.make(GetAttachmentParamsSchema)
export const addAttachmentParamsJsonSchema = JSONSchema.make(AddAttachmentParamsSchema)
export const updateAttachmentParamsJsonSchema = JSONSchema.make(UpdateAttachmentParamsSchema)
export const deleteAttachmentParamsJsonSchema = JSONSchema.make(DeleteAttachmentParamsSchema)
export const pinAttachmentParamsJsonSchema = JSONSchema.make(PinAttachmentParamsSchema)
export const downloadAttachmentParamsJsonSchema = JSONSchema.make(DownloadAttachmentParamsSchema)
export const addIssueAttachmentParamsJsonSchema = JSONSchema.make(AddIssueAttachmentParamsSchema)
export const addDocumentAttachmentParamsJsonSchema = JSONSchema.make(AddDocumentAttachmentParamsSchema)

export const parseListAttachmentsParams = Schema.decodeUnknown(ListAttachmentsParamsSchema)
export const parseGetAttachmentParams = Schema.decodeUnknown(GetAttachmentParamsSchema)
export const parseAddAttachmentParams = Schema.decodeUnknown(AddAttachmentParamsSchema)
export const parseUpdateAttachmentParams = Schema.decodeUnknown(UpdateAttachmentParamsSchema)
export const parseDeleteAttachmentParams = Schema.decodeUnknown(DeleteAttachmentParamsSchema)
export const parsePinAttachmentParams = Schema.decodeUnknown(PinAttachmentParamsSchema)
export const parseDownloadAttachmentParams = Schema.decodeUnknown(DownloadAttachmentParamsSchema)
export const parseAddIssueAttachmentParams = Schema.decodeUnknown(AddIssueAttachmentParamsSchema)
export const parseAddDocumentAttachmentParams = Schema.decodeUnknown(AddDocumentAttachmentParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface AddAttachmentResult {
  readonly attachmentId: AttachmentId
  readonly blobId: BlobId
  readonly url: string
}

export interface UpdateAttachmentResult {
  readonly attachmentId: AttachmentId
  readonly updated: boolean
}

export interface DeleteAttachmentResult {
  readonly attachmentId: AttachmentId
  readonly deleted: boolean
}

export interface PinAttachmentResult {
  readonly attachmentId: AttachmentId
  readonly pinned: boolean
}

export interface DownloadAttachmentResult {
  readonly attachmentId: AttachmentId
  readonly url: string
  readonly name: string
  readonly type: string
  readonly size: number
}
