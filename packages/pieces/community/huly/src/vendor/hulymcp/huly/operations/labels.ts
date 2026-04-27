import type { Class, Data, Doc, DocumentQuery, DocumentUpdate, Ref, Space } from "@hcengineering/core"
import { generateId, SortingOrder } from "@hcengineering/core"
import type { TagCategory as HulyTagCategory, TagElement as HulyTagElement, TagReference } from "@hcengineering/tags"
import { Effect } from "effect"

import type { CreateLabelParams, DeleteLabelParams, ListLabelsParams, UpdateLabelParams } from "../../domain/schemas.js"
import type { RemoveLabelParams, RemoveLabelResult } from "../../domain/schemas/issues.js"
import type {
  CreateLabelResult,
  DeleteLabelResult,
  TagElementSummary,
  UpdateLabelResult
} from "../../domain/schemas/labels.js"
import { ColorCode, IssueIdentifier, TagElementId } from "../../domain/schemas/shared.js"
import { HulyClient, type HulyClientError } from "../client.js"
import type { IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import { TagCategoryNotFoundError, TagNotFoundError } from "../errors.js"
import { core, tags, tracker } from "../huly-plugins.js"
import { clampLimit, findProjectAndIssue, toRef } from "./shared.js"
import { findCategoryByIdOrLabel } from "./tag-categories.js"

type ListLabelsError = HulyClientError | TagCategoryNotFoundError
type CreateLabelError = HulyClientError | TagCategoryNotFoundError
type UpdateLabelError = HulyClientError | TagNotFoundError
type DeleteLabelError = HulyClientError | TagNotFoundError
type RemoveIssueLabelError = HulyClientError | ProjectNotFoundError | IssueNotFoundError | TagNotFoundError

const issueClassRef = toRef<Class<Doc>>(tracker.class.Issue)

const findTagByIdOrTitle = (
  client: HulyClient["Type"],
  idOrTitle: string
): Effect.Effect<HulyTagElement | undefined, HulyClientError> =>
  Effect.gen(function*() {
    const tag = (yield* client.findOne<HulyTagElement>(
      tags.class.TagElement,
      {
        _id: toRef<HulyTagElement>(idOrTitle),
        targetClass: issueClassRef
      }
    )) ?? (yield* client.findOne<HulyTagElement>(
      tags.class.TagElement,
      {
        title: idOrTitle,
        targetClass: issueClassRef
      }
    ))

    return tag
  })

const findTagOrFail = (
  client: HulyClient["Type"],
  idOrTitle: string
): Effect.Effect<HulyTagElement, TagNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    const tag = yield* findTagByIdOrTitle(client, idOrTitle)
    if (tag === undefined) {
      return yield* new TagNotFoundError({ identifier: idOrTitle })
    }
    return tag
  })

const resolveCategoryRef = (
  client: HulyClient["Type"],
  categoryIdOrLabel: string | undefined
): Effect.Effect<Ref<HulyTagCategory> | undefined, TagCategoryNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    if (categoryIdOrLabel === undefined) return undefined
    const cat = yield* findCategoryByIdOrLabel(client, categoryIdOrLabel)
    if (cat === undefined) {
      return yield* new TagCategoryNotFoundError({ identifier: categoryIdOrLabel })
    }
    return cat._id
  })

export const listLabels = (
  params: ListLabelsParams
): Effect.Effect<Array<TagElementSummary>, ListLabelsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const limit = clampLimit(params.limit)

    const query: DocumentQuery<HulyTagElement> = { targetClass: issueClassRef }

    if (params.category !== undefined) {
      const catRef = yield* resolveCategoryRef(client, params.category)
      if (catRef !== undefined) {
        query.category = catRef
      }
    }

    const elements = yield* client.findAll<HulyTagElement>(
      tags.class.TagElement,
      query,
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    return elements.map(e => ({
      id: TagElementId.make(e._id),
      title: e.title,
      // Clamp to valid range — Huly API may return out-of-range color values
      color: ColorCode.make(Math.max(0, Math.min(9, Math.trunc(e.color)))), // eslint-disable-line no-magic-numbers
      category: e.category
    }))
  })

export const createLabel = (
  params: CreateLabelParams
): Effect.Effect<CreateLabelResult, CreateLabelError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const existing = yield* client.findOne<HulyTagElement>(
      tags.class.TagElement,
      {
        title: params.title,
        targetClass: issueClassRef
      }
    )

    if (existing !== undefined) {
      return { id: TagElementId.make(existing._id), title: existing.title, created: false }
    }

    const categoryRef = yield* resolveCategoryRef(client, params.category)

    const tagId: Ref<HulyTagElement> = generateId()
    const color = params.color ?? 0

    const tagData: Data<HulyTagElement> = {
      title: params.title,
      description: params.description ?? "",
      targetClass: issueClassRef,
      color,
      category: categoryRef ?? tracker.category.Other
    }

    yield* client.createDoc(
      tags.class.TagElement,
      toRef<Space>(core.space.Workspace),
      tagData,
      tagId
    )

    return { id: TagElementId.make(tagId), title: params.title, created: true }
  })

export const updateLabel = (
  params: UpdateLabelParams
): Effect.Effect<UpdateLabelResult, UpdateLabelError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const tag = yield* findTagOrFail(client, params.label)

    const updateOps: DocumentUpdate<HulyTagElement> = {}

    if (params.title !== undefined) {
      updateOps.title = params.title
    }
    if (params.color !== undefined) {
      updateOps.color = params.color
    }
    if (params.description !== undefined) {
      updateOps.description = params.description
    }

    if (Object.keys(updateOps).length === 0) {
      return { id: TagElementId.make(tag._id), updated: false }
    }

    yield* client.updateDoc(
      tags.class.TagElement,
      toRef<Space>(core.space.Workspace),
      tag._id,
      updateOps
    )

    return { id: TagElementId.make(tag._id), updated: true }
  })

export const deleteLabel = (
  params: DeleteLabelParams
): Effect.Effect<DeleteLabelResult, DeleteLabelError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const tag = yield* findTagOrFail(client, params.label)

    yield* client.removeDoc(
      tags.class.TagElement,
      toRef<Space>(core.space.Workspace),
      tag._id
    )

    return { id: TagElementId.make(tag._id), deleted: true }
  })

export const removeIssueLabel = (
  params: RemoveLabelParams
): Effect.Effect<RemoveLabelResult, RemoveIssueLabelError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue, project } = yield* findProjectAndIssue(params)

    const labelTitle = params.label.trim()

    const tagRefs = yield* client.findAll<TagReference>(
      tags.class.TagReference,
      {
        attachedTo: issue._id,
        attachedToClass: tracker.class.Issue
      }
    )

    const matchingRef = tagRefs.find(
      r => r.title.toLowerCase() === labelTitle.toLowerCase()
    )

    if (matchingRef === undefined) {
      return yield* new TagNotFoundError({ identifier: labelTitle })
    }

    yield* client.removeDoc(
      tags.class.TagReference,
      project._id,
      matchingRef._id
    )

    return { identifier: IssueIdentifier.make(issue.identifier), labelRemoved: true }
  })
