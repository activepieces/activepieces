import { JSONSchema, Schema } from "effect"

import { LimitParam, NonEmptyString, TagCategoryId, TagCategoryIdentifier } from "./shared.js"

export const TagCategorySummarySchema = Schema.Struct({
  id: TagCategoryId,
  label: NonEmptyString,
  targetClass: NonEmptyString,
  default: Schema.Boolean,
  tags: Schema.Array(Schema.String)
}).annotations({
  title: "TagCategorySummary",
  description: "Tag category summary for list operations"
})

export type TagCategorySummary = Schema.Schema.Type<typeof TagCategorySummarySchema>

export const ListTagCategoriesParamsSchema = Schema.Struct({
  targetClass: Schema.optional(
    NonEmptyString.annotations({
      description: "Filter by target class (e.g. 'tracker:class:Issue'). Defaults to all classes."
    })
  ),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of categories to return (default: 50)"
    })
  )
}).annotations({
  title: "ListTagCategoriesParams",
  description: "Parameters for listing tag categories"
})

export type ListTagCategoriesParams = Schema.Schema.Type<typeof ListTagCategoriesParamsSchema>

export const CreateTagCategoryParamsSchema = Schema.Struct({
  label: NonEmptyString.annotations({
    description: "Category name"
  }),
  targetClass: Schema.optional(
    NonEmptyString.annotations({
      description: "Target class for this category (default: 'tracker:class:Issue')"
    })
  ),
  default: Schema.optional(
    Schema.Boolean.annotations({
      description: "Whether this is a default category (default: false)"
    })
  )
}).annotations({
  title: "CreateTagCategoryParams",
  description: "Parameters for creating a tag category"
})

export type CreateTagCategoryParams = Schema.Schema.Type<typeof CreateTagCategoryParamsSchema>

export const UpdateTagCategoryParamsSchema = Schema.Struct({
  category: TagCategoryIdentifier.annotations({
    description: "Category ID or label name to update"
  }),
  label: Schema.optional(NonEmptyString.annotations({
    description: "New category name"
  })),
  default: Schema.optional(
    Schema.Boolean.annotations({
      description: "New default flag"
    })
  )
}).annotations({
  title: "UpdateTagCategoryParams",
  description: "Parameters for updating a tag category"
})

export type UpdateTagCategoryParams = Schema.Schema.Type<typeof UpdateTagCategoryParamsSchema>

export const DeleteTagCategoryParamsSchema = Schema.Struct({
  category: TagCategoryIdentifier.annotations({
    description: "Category ID or label name to delete"
  })
}).annotations({
  title: "DeleteTagCategoryParams",
  description: "Parameters for deleting a tag category"
})

export type DeleteTagCategoryParams = Schema.Schema.Type<typeof DeleteTagCategoryParamsSchema>

export const listTagCategoriesParamsJsonSchema = JSONSchema.make(ListTagCategoriesParamsSchema)
export const createTagCategoryParamsJsonSchema = JSONSchema.make(CreateTagCategoryParamsSchema)
export const updateTagCategoryParamsJsonSchema = JSONSchema.make(UpdateTagCategoryParamsSchema)
export const deleteTagCategoryParamsJsonSchema = JSONSchema.make(DeleteTagCategoryParamsSchema)

export const parseListTagCategoriesParams = Schema.decodeUnknown(ListTagCategoriesParamsSchema)
export const parseCreateTagCategoryParams = Schema.decodeUnknown(CreateTagCategoryParamsSchema)
export const parseUpdateTagCategoryParams = Schema.decodeUnknown(UpdateTagCategoryParamsSchema)
export const parseDeleteTagCategoryParams = Schema.decodeUnknown(DeleteTagCategoryParamsSchema)

export interface CreateTagCategoryResult {
  readonly id: TagCategoryId
  readonly label: string
  readonly created: boolean
}

export interface UpdateTagCategoryResult {
  readonly id: TagCategoryId
  readonly updated: boolean
}

export interface DeleteTagCategoryResult {
  readonly id: TagCategoryId
  readonly deleted: boolean
}
