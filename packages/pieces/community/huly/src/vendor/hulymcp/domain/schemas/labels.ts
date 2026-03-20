import { JSONSchema, Schema } from "effect"

import { ColorCode, LimitParam, NonEmptyString, TagCategoryIdentifier, TagElementId, TagIdentifier } from "./shared.js"

export const TagElementSummarySchema = Schema.Struct({
  id: TagElementId,
  title: NonEmptyString,
  color: ColorCode,
  category: NonEmptyString
}).annotations({
  title: "TagElementSummary",
  description: "Label/tag summary for list operations"
})

export type TagElementSummary = Schema.Schema.Type<typeof TagElementSummarySchema>

export const ListLabelsParamsSchema = Schema.Struct({
  category: Schema.optional(
    TagCategoryIdentifier.annotations({
      description: "Filter by category ID or label name"
    })
  ),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of labels to return (default: 50)"
    })
  )
}).annotations({
  title: "ListLabelsParams",
  description: "Parameters for listing label definitions"
})

export type ListLabelsParams = Schema.Schema.Type<typeof ListLabelsParamsSchema>

export const CreateLabelParamsSchema = Schema.Struct({
  title: NonEmptyString.annotations({
    description: "Label name"
  }),
  color: Schema.optional(
    ColorCode.annotations({
      description: "Color code (0-9, default: 0)"
    })
  ),
  description: Schema.optional(Schema.String.annotations({
    description: "Label description"
  })),
  category: Schema.optional(
    TagCategoryIdentifier.annotations({
      description: "Category ID or label name. Falls back to tracker default category ('Other') if not specified."
    })
  )
}).annotations({
  title: "CreateLabelParams",
  description: "Parameters for creating a label definition"
})

export type CreateLabelParams = Schema.Schema.Type<typeof CreateLabelParamsSchema>

export const UpdateLabelParamsSchema = Schema.Struct({
  label: TagIdentifier.annotations({
    description: "Label ID or title to update"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "New label name"
  })),
  color: Schema.optional(
    ColorCode.annotations({
      description: "New color code (0-9)"
    })
  ),
  description: Schema.optional(Schema.String.annotations({
    description: "New label description"
  }))
}).annotations({
  title: "UpdateLabelParams",
  description: "Parameters for updating a label definition"
})

export type UpdateLabelParams = Schema.Schema.Type<typeof UpdateLabelParamsSchema>

export const DeleteLabelParamsSchema = Schema.Struct({
  label: TagIdentifier.annotations({
    description: "Label ID or title to delete"
  })
}).annotations({
  title: "DeleteLabelParams",
  description: "Parameters for deleting a label definition"
})

export type DeleteLabelParams = Schema.Schema.Type<typeof DeleteLabelParamsSchema>

export const listLabelsParamsJsonSchema = JSONSchema.make(ListLabelsParamsSchema)
export const createLabelParamsJsonSchema = JSONSchema.make(CreateLabelParamsSchema)
export const updateLabelParamsJsonSchema = JSONSchema.make(UpdateLabelParamsSchema)
export const deleteLabelParamsJsonSchema = JSONSchema.make(DeleteLabelParamsSchema)

export const parseListLabelsParams = Schema.decodeUnknown(ListLabelsParamsSchema)
export const parseCreateLabelParams = Schema.decodeUnknown(CreateLabelParamsSchema)
export const parseUpdateLabelParams = Schema.decodeUnknown(UpdateLabelParamsSchema)
export const parseDeleteLabelParams = Schema.decodeUnknown(DeleteLabelParamsSchema)

export interface CreateLabelResult {
  readonly id: TagElementId
  readonly title: string
  readonly created: boolean
}

export interface UpdateLabelResult {
  readonly id: TagElementId
  readonly updated: boolean
}

export interface DeleteLabelResult {
  readonly id: TagElementId
  readonly deleted: boolean
}
