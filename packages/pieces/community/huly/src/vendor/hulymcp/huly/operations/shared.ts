import type { Channel, Person } from "@hcengineering/contact"
import type { Class, Doc, DocumentQuery, FindOptions, PersonUuid, Ref, Status, WithLookup } from "@hcengineering/core"
import type { ProjectType } from "@hcengineering/task"
import type { Issue as HulyIssue, Project as HulyProject } from "@hcengineering/tracker"
import { IssuePriority } from "@hcengineering/tracker"
import { Effect } from "effect"

import type { IssuePriority as IssuePriorityStr } from "../../domain/schemas/issues.js"
import { MAX_LIMIT, type NonNegativeNumber } from "../../domain/schemas/shared.js"
import { PositiveNumber } from "../../domain/schemas/shared.js"
import { normalizeForComparison } from "../../utils/normalize.js"
import { HulyClient, type HulyClientError, type HulyClientOperations } from "../client.js"
import { InvalidPersonUuidError, InvalidStatusError, IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import { contact, core, task, tracker } from "../huly-plugins.js"
import { escapeLikeWildcards } from "./query-helpers.js"

// Huly SDK uses `Ref<T>` (a branded string) for entity references.
// Our domain uses Effect Schema brands. No type-safe bridge exists; this is the boundary cast.
// eslint-disable-next-line no-restricted-syntax -- see above
export const toRef = <T extends Doc>(id: string): Ref<T> => id as Ref<T>

// Huly API uses 0 as sentinel for "not set" on numeric fields like estimation and remainingTime.
// Confirmed: creating an issue without estimation stores 0, not null/undefined.
// Converts sentinel 0 → undefined; positive values → branded PositiveNumber.
export const zeroAsUnset = (value: NonNegativeNumber): PositiveNumber | undefined =>
  value > 0 ? PositiveNumber.make(value) : undefined

export const findOneOrFail = <T extends Doc, E>(
  client: HulyClientOperations,
  _class: Ref<Class<T>>,
  query: DocumentQuery<T>,
  onNotFound: () => E,
  options?: FindOptions<T>
): Effect.Effect<WithLookup<T>, E | HulyClientError> =>
  Effect.flatMap(
    client.findOne<T>(_class, query, options),
    (result) =>
      result !== undefined
        ? Effect.succeed(result)
        : Effect.fail(onNotFound())
  )

export const findByNameOrId = <T extends Doc>(
  client: HulyClientOperations,
  _class: Ref<Class<T>>,
  primaryQuery: DocumentQuery<T>,
  fallbackQuery: DocumentQuery<T>,
  options?: FindOptions<T>
): Effect.Effect<WithLookup<T> | undefined, HulyClientError> =>
  Effect.flatMap(
    client.findOne<T>(_class, primaryQuery, options),
    (result) =>
      result !== undefined
        ? Effect.succeed(result)
        : client.findOne<T>(_class, fallbackQuery, options)
  )

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const validatePersonUuid = (uuid?: string): Effect.Effect<PersonUuid | undefined, InvalidPersonUuidError> => {
  if (uuid === undefined) return Effect.succeed(undefined)
  if (!UUID_REGEX.test(uuid)) {
    return Effect.fail(new InvalidPersonUuidError({ uuid }))
  }
  // PersonUuid is a branded string type from @hcengineering/core.
  // After regex validation confirms UUID format, cast is safe.
  // eslint-disable-next-line no-restricted-syntax -- see above
  return Effect.succeed(uuid as PersonUuid)
}

const statusClassRef = core.class.Status

type ProjectWithType = WithLookup<HulyProject> & {
  $lookup?: { type?: ProjectType }
}

export const findProject = (
  projectIdentifier: string
): Effect.Effect<
  { client: HulyClient["Type"]; project: HulyProject },
  ProjectNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const project = yield* findOneOrFail(
      client,
      tracker.class.Project,
      { identifier: projectIdentifier },
      () => new ProjectNotFoundError({ identifier: projectIdentifier })
    )

    return { client, project }
  })

export type StatusInfo = {
  _id: Ref<Status>
  name: string
  isDone: boolean
  isCanceled: boolean
}

/**
 * Find project with its ProjectType lookup to get status information.
 * This avoids querying IssueStatus directly which can fail on some workspaces.
 *
 * If Status query fails (known bug on some workspaces), falls back to using
 * status refs without resolved names.
 */
export const findProjectWithStatuses = (
  projectIdentifier: string
): Effect.Effect<
  {
    client: HulyClient["Type"]
    project: HulyProject
    statuses: Array<StatusInfo>
    defaultStatusId: Ref<Status> | undefined
  },
  ProjectNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const project = yield* findOneOrFail<ProjectWithType, ProjectNotFoundError>(
      client,
      tracker.class.Project,
      { identifier: projectIdentifier },
      () => new ProjectNotFoundError({ identifier: projectIdentifier }),
      { lookup: { type: task.class.ProjectType } }
    )

    const projectType = project.$lookup?.type
    const statuses: Array<StatusInfo> = []

    const wonCategory = task.statusCategory.Won
    const lostCategory = task.statusCategory.Lost

    if (projectType?.statuses) {
      const statusRefs = projectType.statuses.map(s => s._id)
      if (statusRefs.length > 0) {
        // Try to query Status documents for names
        // On some workspaces this fails with deserialization errors
        const statusDocsResult = yield* Effect.either(
          client.findAll<Status>(
            statusClassRef,
            { _id: { $in: statusRefs } }
          )
        )

        if (statusDocsResult._tag === "Right") {
          for (const doc of statusDocsResult.right) {
            const categoryStr = doc.category ? doc.category : ""
            statuses.push({
              _id: doc._id,
              name: doc.name,
              isDone: categoryStr === wonCategory,
              isCanceled: categoryStr === lostCategory
            })
          }
        } else {
          // Fallback: use refs without names if Status query fails
          // This allows operations to work even with malformed workspace data
          yield* Effect.logWarning(
            `Status query failed for project ${projectIdentifier}, using fallback. `
              + `Category-based filtering (open/done/canceled) will use name heuristics. `
              + `Error: ${statusDocsResult.left.message}`
          )
          for (const ps of projectType.statuses) {
            const name = ps._id.split(":").pop() ?? "Unknown"
            const nameLower = name.toLowerCase()
            // Infer done/canceled from common status name patterns
            const isDone = nameLower.includes("done")
              || nameLower.includes("complete")
              || nameLower.includes("finished")
              || nameLower.includes("resolved")
              || nameLower.includes("closed")
            const isCanceled = nameLower.includes("cancel")
              || nameLower.includes("reject")
              || nameLower.includes("abort")
              || nameLower.includes("wontfix")
              || nameLower.includes("invalid")
            statuses.push({
              _id: ps._id,
              name,
              isDone,
              isCanceled
            })
          }
        }
      }
    }

    // project.defaultIssueStatus is typed as required Ref<IssueStatus> in the SDK,
    // but is undefined or "" at runtime when no explicit default was chosen at project creation.
    // Use || (not ??) to catch both undefined and empty string.
    const defaultStatusId: Ref<Status> | undefined = project.defaultIssueStatus || statuses[0]?._id

    return { client, project, statuses, defaultStatusId }
  })

export const parseIssueIdentifier = (
  identifier: string | number,
  projectIdentifier: string
): { fullIdentifier: string; number: number | null } => {
  const idStr = String(identifier).trim()

  const match = idStr.match(/^([A-Z]+)-(\d+)$/i)
  if (match) {
    return {
      fullIdentifier: `${match[1].toUpperCase()}-${match[2]}`,
      number: parseInt(match[2], 10)
    }
  }

  const numMatch = idStr.match(/^\d+$/)
  if (numMatch) {
    const num = parseInt(idStr, 10)
    return {
      fullIdentifier: `${projectIdentifier.toUpperCase()}-${num}`,
      number: num
    }
  }

  return { fullIdentifier: idStr, number: null }
}

export const findIssueInProject = (
  client: HulyClient["Type"],
  project: HulyProject,
  identifierStr: string
): Effect.Effect<HulyIssue, IssueNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    const { fullIdentifier, number } = parseIssueIdentifier(
      identifierStr,
      project.identifier
    )

    const issue = (yield* client.findOne<HulyIssue>(
      tracker.class.Issue,
      {
        space: project._id,
        identifier: fullIdentifier
      }
    )) ?? (number !== null
      ? yield* client.findOne<HulyIssue>(
        tracker.class.Issue,
        {
          space: project._id,
          number
        }
      )
      : undefined)
    if (issue === undefined) {
      return yield* new IssueNotFoundError({
        identifier: identifierStr,
        project: project.identifier
      })
    }

    return issue
  })

export const findProjectAndIssue = (
  params: { project: string; identifier: string }
): Effect.Effect<
  { client: HulyClient["Type"]; project: HulyProject; issue: HulyIssue },
  ProjectNotFoundError | IssueNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)
    const issue = yield* findIssueInProject(client, project, params.identifier)
    return { client, project, issue }
  })

const priorityToStringMap = {
  [IssuePriority.Urgent]: "urgent",
  [IssuePriority.High]: "high",
  [IssuePriority.Medium]: "medium",
  [IssuePriority.Low]: "low",
  [IssuePriority.NoPriority]: "no-priority"
} as const satisfies Record<IssuePriority, IssuePriorityStr>

export const priorityToString = (priority: IssuePriority): IssuePriorityStr => priorityToStringMap[priority]

const stringToPriorityMap = {
  "urgent": IssuePriority.Urgent,
  "high": IssuePriority.High,
  "medium": IssuePriority.Medium,
  "low": IssuePriority.Low,
  "no-priority": IssuePriority.NoPriority
} as const satisfies Record<IssuePriorityStr, IssuePriority>

export const stringToPriority = (priority: IssuePriorityStr): IssuePriority => stringToPriorityMap[priority]

const DEFAULT_LIMIT = 50

export const clampLimit = (limit?: number): number => Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT)

export const findPersonByEmailOrName = (
  client: HulyClient["Type"],
  emailOrName: string
): Effect.Effect<Person | undefined, HulyClientError> =>
  Effect.gen(function*() {
    // 1. Exact email channel match (email channels only)
    const exactChannel = yield* client.findOne<Channel>(
      contact.class.Channel,
      {
        value: emailOrName,
        provider: contact.channelProvider.Email
      }
    )
    if (exactChannel !== undefined) {
      const person = yield* client.findOne<Person>(
        contact.class.Person,
        { _id: toRef<Person>(exactChannel.attachedTo) }
      )
      if (person !== undefined) return person
    }

    // 2. Exact name match
    const exactPerson = yield* client.findOne<Person>(
      contact.class.Person,
      { name: emailOrName }
    )
    if (exactPerson !== undefined) return exactPerson

    // 3. Substring email channel match via $like (email channels only)
    const escaped = escapeLikeWildcards(emailOrName)
    const likeChannel = yield* client.findOne<Channel>(
      contact.class.Channel,
      {
        value: { $like: `%${escaped}%` },
        provider: contact.channelProvider.Email
      }
    )
    if (likeChannel !== undefined) {
      const person = yield* client.findOne<Person>(
        contact.class.Person,
        { _id: toRef<Person>(likeChannel.attachedTo) }
      )
      if (person !== undefined) return person
    }

    // 4. Substring name match via $like
    const likePerson = yield* client.findOne<Person>(
      contact.class.Person,
      { name: { $like: `%${escaped}%` } }
    )
    return likePerson
  })

export const resolveStatusByName = (
  statuses: Array<StatusInfo>,
  statusName: string,
  project: string
): Effect.Effect<Ref<Status>, InvalidStatusError> => {
  const normalizedInput = normalizeForComparison(statusName)
  const matchingStatus = statuses.find(
    s => normalizeForComparison(s.name) === normalizedInput
  )
  if (matchingStatus === undefined) {
    return Effect.fail(new InvalidStatusError({ status: statusName, project }))
  }
  return Effect.succeed(matchingStatus._id)
}
