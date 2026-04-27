import type { Class, Data, Doc, DocumentQuery, DocumentUpdate, Ref, Space } from "@hcengineering/core"
import { generateId, SortingOrder } from "@hcengineering/core"
import type { Asset } from "@hcengineering/platform"
import type { TagCategory as HulyTagCategory } from "@hcengineering/tags"
import { Effect } from "effect"

import { TagCategoryId } from "../../domain/schemas/shared.js"
import type {
  CreateTagCategoryParams,
  CreateTagCategoryResult,
  DeleteTagCategoryParams,
  DeleteTagCategoryResult,
  ListTagCategoriesParams,
  TagCategorySummary,
  UpdateTagCategoryParams,
  UpdateTagCategoryResult
} from "../../domain/schemas/tag-categories.js"
import { HulyClient, type HulyClientError } from "../client.js"
import { TagCategoryNotFoundError } from "../errors.js"
import { core, tags, tracker } from "../huly-plugins.js"
import { clampLimit, toRef } from "./shared.js"

type ListTagCategoriesError = HulyClientError
type CreateTagCategoryError = HulyClientError
type UpdateTagCategoryError = HulyClientError | TagCategoryNotFoundError
type DeleteTagCategoryError = HulyClientError | TagCategoryNotFoundError

const issueClassRef = toRef<Class<Doc>>(tracker.class.Issue)

export const findCategoryByIdOrLabel = (
  client: HulyClient["Type"],
  idOrLabel: string
): Effect.Effect<HulyTagCategory | undefined, HulyClientError> =>
  Effect.gen(function*() {
    const cat = (yield* client.findOne<HulyTagCategory>(
      tags.class.TagCategory,
      { _id: toRef<HulyTagCategory>(idOrLabel) }
    )) ?? (yield* client.findOne<HulyTagCategory>(
      tags.class.TagCategory,
      { label: idOrLabel }
    ))

    return cat
  })

const findCategoryOrFail = (
  client: HulyClient["Type"],
  idOrLabel: string
): Effect.Effect<HulyTagCategory, TagCategoryNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    const cat = yield* findCategoryByIdOrLabel(client, idOrLabel)
    if (cat === undefined) {
      return yield* new TagCategoryNotFoundError({ identifier: idOrLabel })
    }
    return cat
  })

const toSummary = (c: HulyTagCategory): TagCategorySummary => ({
  id: TagCategoryId.make(c._id),
  label: c.label,
  targetClass: c.targetClass,
  default: c.default,
  tags: c.tags
})

export const listTagCategories = (
  params: ListTagCategoriesParams
): Effect.Effect<Array<TagCategorySummary>, ListTagCategoriesError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const limit = clampLimit(params.limit)

    const query: DocumentQuery<HulyTagCategory> = {}
    if (params.targetClass !== undefined) {
      query.targetClass = toRef<Class<Doc>>(params.targetClass)
    }

    const categories = yield* client.findAll<HulyTagCategory>(
      tags.class.TagCategory,
      query,
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    return categories.map(toSummary)
  })

export const createTagCategory = (
  params: CreateTagCategoryParams
): Effect.Effect<CreateTagCategoryResult, CreateTagCategoryError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const targetClass = params.targetClass !== undefined
      ? toRef<Class<Doc>>(params.targetClass)
      : issueClassRef

    const existing = yield* client.findOne<HulyTagCategory>(
      tags.class.TagCategory,
      { label: params.label, targetClass }
    )

    if (existing !== undefined) {
      return { id: TagCategoryId.make(existing._id), label: existing.label, created: false }
    }

    const catId: Ref<HulyTagCategory> = generateId()

    const catData: Data<HulyTagCategory> = {
      // Asset is a branded string type (Metadata<URL>) with no runtime constructor.
      // Empty string is the "no icon" sentinel; Huly UI renders a default icon.
      // Verified: Huly accepts "" without error (tested against v0.7.353).
      // eslint-disable-next-line no-restricted-syntax -- see above
      icon: "" as Asset,
      label: params.label,
      targetClass,
      // Huly does NOT auto-populate tags[] when TagElements reference this category.
      // To find labels in a category, query TagElements by their `category` field instead.
      tags: [],
      default: params.default ?? false
    }

    yield* client.createDoc(
      tags.class.TagCategory,
      toRef<Space>(core.space.Workspace),
      catData,
      catId
    )

    return { id: TagCategoryId.make(catId), label: params.label, created: true }
  })

export const updateTagCategory = (
  params: UpdateTagCategoryParams
): Effect.Effect<UpdateTagCategoryResult, UpdateTagCategoryError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const cat = yield* findCategoryOrFail(client, params.category)

    const updateOps: DocumentUpdate<HulyTagCategory> = {}

    if (params.label !== undefined) {
      updateOps.label = params.label
    }
    if (params.default !== undefined) {
      updateOps.default = params.default
    }

    if (Object.keys(updateOps).length === 0) {
      return { id: TagCategoryId.make(cat._id), updated: false }
    }

    yield* client.updateDoc(
      tags.class.TagCategory,
      toRef<Space>(core.space.Workspace),
      cat._id,
      updateOps
    )

    return { id: TagCategoryId.make(cat._id), updated: true }
  })

export const deleteTagCategory = (
  params: DeleteTagCategoryParams
): Effect.Effect<DeleteTagCategoryResult, DeleteTagCategoryError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const cat = yield* findCategoryOrFail(client, params.category)

    // Huly does NOT cascade-delete TagElements when their category is removed.
    // Labels will be orphaned with a dangling category ref.
    yield* client.removeDoc(
      tags.class.TagCategory,
      toRef<Space>(core.space.Workspace),
      cat._id
    )

    return { id: TagCategoryId.make(cat._id), deleted: true }
  })
