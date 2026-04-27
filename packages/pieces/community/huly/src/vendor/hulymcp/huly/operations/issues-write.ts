/**
 * Issue write operations: create, update, delete.
 *
 * @module
 */
import type { Person } from "@hcengineering/contact"
import {
  type AttachedData,
  type Class,
  type Doc,
  type DocumentUpdate,
  generateId,
  type MarkupBlobRef,
  type Ref,
  SortingOrder,
  type Space,
  type Status
} from "@hcengineering/core"
import { makeRank } from "@hcengineering/rank"
import { type Issue as HulyIssue, type IssueParentInfo, type Project as HulyProject } from "@hcengineering/tracker"
import { Effect, Schema } from "effect"

import type { CreateIssueParams, DeleteIssueParams, UpdateIssueParams } from "../../domain/schemas.js"
import type { CreateIssueResult, DeleteIssueResult, UpdateIssueResult } from "../../domain/schemas/issues.js"
import { IssueId, IssueIdentifier } from "../../domain/schemas/shared.js"
import type { HulyClient, HulyClientError } from "../client.js"
import type { IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import { InvalidStatusError, PersonNotFoundError } from "../errors.js"
import { tracker } from "../huly-plugins.js"
import {
  findIssueInProject,
  findPersonByEmailOrName,
  findProjectAndIssue,
  findProjectWithStatuses,
  resolveStatusByName,
  type StatusInfo,
  stringToPriority,
  toRef
} from "./shared.js"

type CreateIssueError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | InvalidStatusError
  | PersonNotFoundError

type UpdateIssueError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | InvalidStatusError
  | PersonNotFoundError

type DeleteIssueError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError

// SDK: updateDoc with retrieve=true returns TxResult which doesn't type the embedded object.
// The runtime value includes { object: { sequence: number } } for $inc operations.
const TxIncResult = Schema.Struct({
  object: Schema.Struct({
    sequence: Schema.Number
  })
})

const extractUpdatedSequence = (txResult: unknown): number | undefined => {
  const decoded = Schema.decodeUnknownOption(TxIncResult)(txResult)
  return decoded._tag === "Some" ? decoded.value.object.sequence : undefined
}

const resolveAssignee = (
  client: HulyClient["Type"],
  assigneeIdentifier: string
): Effect.Effect<Person, PersonNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    const person = yield* findPersonByEmailOrName(client, assigneeIdentifier)
    if (person === undefined) {
      return yield* new PersonNotFoundError({ identifier: assigneeIdentifier })
    }
    return person
  })

/**
 * Create a new issue in a project.
 *
 * Creates issue with:
 * - Title (required)
 * - Description (optional, markdown supported)
 * - Priority (optional, defaults to no-priority)
 * - Status (optional, uses project default)
 * - Assignee (optional, by email or name)
 */
export const createIssue = (
  params: CreateIssueParams
): Effect.Effect<CreateIssueResult, CreateIssueError, HulyClient> =>
  Effect.gen(function*() {
    const { client, defaultStatusId, project, statuses } = yield* findProjectWithStatuses(params.project)

    const issueId: Ref<HulyIssue> = generateId()

    const incOps: DocumentUpdate<HulyProject> = { $inc: { sequence: 1 } }
    const incResult = yield* client.updateDoc(
      tracker.class.Project,
      toRef<Space>("core:space:Space"),
      project._id,
      incOps,
      true
    )
    const sequence = extractUpdatedSequence(incResult) ?? project.sequence + 1

    const statusRef: Ref<Status> = params.status !== undefined
      ? yield* resolveStatusByName(statuses, params.status, params.project)
      : defaultStatusId !== undefined
      ? defaultStatusId
      : yield* Effect.fail(new InvalidStatusError({ status: "(default)", project: params.project }))

    const assigneeRef: Ref<Person> | null = params.assignee !== undefined
      ? (yield* resolveAssignee(client, params.assignee))._id
      : null

    const lastIssue = yield* client.findOne<HulyIssue>(
      tracker.class.Issue,
      { space: project._id },
      { sort: { rank: SortingOrder.Descending } }
    )
    const rank = makeRank(lastIssue?.rank, undefined)

    const descriptionMarkupRef: MarkupBlobRef | null =
      params.description !== undefined && params.description.trim() !== ""
        ? yield* client.uploadMarkup(
          tracker.class.Issue,
          issueId,
          "description",
          params.description,
          "markdown"
        )
        : null

    const priority = stringToPriority(params.priority || "no-priority")
    const identifier = `${project.identifier}-${sequence}`

    type ParentData = {
      attachedTo: Ref<Doc>
      attachedToClass: Ref<Class<Doc>>
      collection: string
      parents: Array<IssueParentInfo>
    }
    const parentIssueParam = params.parentIssue
    const { attachedTo, attachedToClass, collection, parents }: ParentData = parentIssueParam !== undefined
      ? yield* Effect.gen(function*() {
        const parentIssue = yield* findIssueInProject(client, project, parentIssueParam)
        return {
          attachedTo: parentIssue._id,
          attachedToClass: tracker.class.Issue,
          collection: "subIssues",
          parents: [
            ...parentIssue.parents,
            {
              parentId: parentIssue._id,
              identifier: parentIssue.identifier,
              parentTitle: parentIssue.title,
              space: project._id
            }
          ]
        }
      })
      : {
        attachedTo: project._id,
        attachedToClass: tracker.class.Project,
        collection: "issues",
        parents: []
      }

    const issueData: AttachedData<HulyIssue> = {
      title: params.title,
      description: descriptionMarkupRef,
      status: statusRef,
      number: sequence,
      kind: tracker.taskTypes.Issue,
      identifier,
      priority,
      assignee: assigneeRef,
      component: null,
      estimation: 0,
      remainingTime: 0,
      reportedTime: 0,
      reports: 0,
      subIssues: 0,
      parents,
      childInfo: [],
      dueDate: null,
      rank
    }
    yield* client.addCollection(
      tracker.class.Issue,
      project._id,
      attachedTo,
      attachedToClass,
      collection,
      issueData,
      issueId
    )

    return { identifier: IssueIdentifier.make(identifier), issueId: IssueId.make(issueId) }
  })

/**
 * Update an existing issue in a project.
 *
 * Updates only provided fields:
 * - title: New title
 * - description: New markdown description (uploaded via uploadMarkup)
 * - status: New status (resolved by name)
 * - priority: New priority
 * - assignee: New assignee email/name, or null to unassign
 *
 * Note: Huly REST API is eventually consistent. Reads immediately after
 * updates may return stale data. Allow ~2 seconds for propagation.
 */
export const updateIssue = (
  params: UpdateIssueParams
): Effect.Effect<UpdateIssueResult, UpdateIssueError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue, project } = yield* findProjectAndIssue(params)

    const statuses: Array<StatusInfo> = params.status !== undefined
      ? (yield* findProjectWithStatuses(params.project)).statuses
      : []

    const updateOps: DocumentUpdate<HulyIssue> = {}
    let descriptionUpdatedInPlace = false

    if (params.title !== undefined) {
      updateOps.title = params.title
    }

    if (params.description !== undefined) {
      if (params.description.trim() === "") {
        updateOps.description = null
      } else if (issue.description) {
        // Issue already has description - update in place
        yield* client.updateMarkup(
          tracker.class.Issue,
          issue._id,
          "description",
          params.description,
          "markdown"
        )
        descriptionUpdatedInPlace = true
      } else {
        // Issue has no description yet - create new
        const descriptionMarkupRef = yield* client.uploadMarkup(
          tracker.class.Issue,
          issue._id,
          "description",
          params.description,
          "markdown"
        )
        updateOps.description = descriptionMarkupRef
      }
    }

    if (params.status !== undefined) {
      updateOps.status = yield* resolveStatusByName(statuses, params.status, params.project)
    }

    if (params.priority !== undefined) {
      updateOps.priority = stringToPriority(params.priority)
    }

    if (params.assignee !== undefined) {
      if (params.assignee === null) {
        updateOps.assignee = null
      } else {
        const person = yield* resolveAssignee(client, params.assignee)
        updateOps.assignee = person._id
      }
    }

    if (Object.keys(updateOps).length === 0 && !descriptionUpdatedInPlace) {
      return { identifier: IssueIdentifier.make(issue.identifier), updated: false }
    }

    if (Object.keys(updateOps).length > 0) {
      yield* client.updateDoc(
        tracker.class.Issue,
        project._id,
        issue._id,
        updateOps
      )
    }

    return { identifier: IssueIdentifier.make(issue.identifier), updated: true }
  })

/**
 * Delete an issue from a project.
 *
 * Permanently removes the issue. This operation cannot be undone.
 */
export const deleteIssue = (
  params: DeleteIssueParams
): Effect.Effect<DeleteIssueResult, DeleteIssueError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue, project } = yield* findProjectAndIssue(params)

    yield* client.removeDoc(
      tracker.class.Issue,
      project._id,
      issue._id
    )

    return { identifier: IssueIdentifier.make(issue.identifier), deleted: true }
  })
