import type { Class, Doc, DocumentUpdate, Ref, RelatedDocument } from "@hcengineering/core"
import type { Issue as HulyIssue, Project as HulyProject } from "@hcengineering/tracker"
import { Effect } from "effect"

import type {
  AddIssueRelationParams,
  AddIssueRelationResult,
  ListIssueRelationsParams,
  ListIssueRelationsResult,
  RelationEntry,
  RemoveIssueRelationParams,
  RemoveIssueRelationResult
} from "../../domain/schemas/relations.js"
import type { HulyClient, HulyClientError } from "../client.js"
import type { IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import { tracker } from "../huly-plugins.js"
import { findIssueInProject, findProject, findProjectAndIssue, parseIssueIdentifier, toRef } from "./shared.js"

type RelationError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError

const resolveTargetIssue = (
  client: HulyClient["Type"],
  sourceProject: HulyProject,
  targetIssueStr: string
): Effect.Effect<
  { issue: HulyIssue; project: HulyProject },
  ProjectNotFoundError | IssueNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const { fullIdentifier } = parseIssueIdentifier(targetIssueStr, sourceProject.identifier)
    const match = fullIdentifier.match(/^([A-Z]+)-\d+$/i)
    const prefix = match ? match[1].toUpperCase() : null

    if (prefix !== null && prefix !== sourceProject.identifier.toUpperCase()) {
      const { client: c, project: targetProject } = yield* findProject(prefix)
      const issue = yield* findIssueInProject(c, targetProject, targetIssueStr)
      return { issue, project: targetProject }
    }

    const issue = yield* findIssueInProject(client, sourceProject, targetIssueStr)
    return { issue, project: sourceProject }
  })

// RelatedDocument = Pick<Doc, '_id' | '_class'>. Ref<HulyIssue> → Ref<Doc> requires cast
// because Ref is invariant on its phantom type parameter. toRef bridges the branded string.
const makeRelatedDoc = (issue: HulyIssue): RelatedDocument => ({
  _id: toRef<Doc>(issue._id),
  _class: toRef<Class<Doc>>(tracker.class.Issue)
})

const hasRelation = (arr: Array<RelatedDocument> | undefined, targetId: Ref<HulyIssue>): boolean =>
  arr?.some(r => r._id === toRef<Doc>(targetId)) ?? false

export const addIssueRelation = (
  params: AddIssueRelationParams
): Effect.Effect<AddIssueRelationResult, RelationError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue: source, project } = yield* findProjectAndIssue({
      project: params.project,
      identifier: params.issueIdentifier
    })
    const { issue: target, project: targetProject } = yield* resolveTargetIssue(
      client,
      project,
      params.targetIssue
    )

    const result = { sourceIssue: source.identifier, targetIssue: target.identifier, relationType: params.relationType }

    // DocumentUpdate<HulyIssue> cast needed on $push/$pull literals: TS cannot infer which arm
    // of the complex intersection type (Partial<Data<T>> & PushOptions<T> & ...) applies.
    /* eslint-disable no-restricted-syntax -- see above */
    switch (params.relationType) {
      case "blocks": {
        if (hasRelation(target.blockedBy, source._id)) {
          return { ...result, added: false }
        }
        // "blocks": source blocks target. Huly stores this on the blocked issue's blockedBy array.
        yield* client.updateDoc(
          tracker.class.Issue,
          targetProject._id,
          target._id,
          { $push: { blockedBy: makeRelatedDoc(source) } } as DocumentUpdate<HulyIssue>
        )
        return { ...result, added: true }
      }
      case "is-blocked-by": {
        if (hasRelation(source.blockedBy, target._id)) {
          return { ...result, added: false }
        }
        yield* client.updateDoc(
          tracker.class.Issue,
          project._id,
          source._id,
          { $push: { blockedBy: makeRelatedDoc(target) } } as DocumentUpdate<HulyIssue>
        )
        return { ...result, added: true }
      }
      case "relates-to": {
        if (hasRelation(source.relations, target._id)) {
          return { ...result, added: false }
        }
        // Bidirectional: push to both sides. Partial failure accepted — matches Huly UI behavior.
        yield* client.updateDoc(
          tracker.class.Issue,
          project._id,
          source._id,
          { $push: { relations: makeRelatedDoc(target) } } as DocumentUpdate<HulyIssue>
        )
        yield* client.updateDoc(
          tracker.class.Issue,
          targetProject._id,
          target._id,
          { $push: { relations: makeRelatedDoc(source) } } as DocumentUpdate<HulyIssue>
        )
        return { ...result, added: true }
      }
    }
    /* eslint-enable no-restricted-syntax */
  })

export const removeIssueRelation = (
  params: RemoveIssueRelationParams
): Effect.Effect<RemoveIssueRelationResult, RelationError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue: source, project } = yield* findProjectAndIssue({
      project: params.project,
      identifier: params.issueIdentifier
    })
    const { issue: target, project: targetProject } = yield* resolveTargetIssue(
      client,
      project,
      params.targetIssue
    )

    const result = { sourceIssue: source.identifier, targetIssue: target.identifier, relationType: params.relationType }

    /* eslint-disable no-restricted-syntax -- see above */
    switch (params.relationType) {
      case "blocks": {
        if (!hasRelation(target.blockedBy, source._id)) {
          return { ...result, removed: false }
        }
        yield* client.updateDoc(
          tracker.class.Issue,
          targetProject._id,
          target._id,
          { $pull: { blockedBy: { _id: toRef<Doc>(source._id) } } } as DocumentUpdate<HulyIssue>
        )
        return { ...result, removed: true }
      }
      case "is-blocked-by": {
        if (!hasRelation(source.blockedBy, target._id)) {
          return { ...result, removed: false }
        }
        yield* client.updateDoc(
          tracker.class.Issue,
          project._id,
          source._id,
          { $pull: { blockedBy: { _id: toRef<Doc>(target._id) } } } as DocumentUpdate<HulyIssue>
        )
        return { ...result, removed: true }
      }
      case "relates-to": {
        if (!hasRelation(source.relations, target._id)) {
          return { ...result, removed: false }
        }
        // Bidirectional: pull from both sides. Partial failure accepted — matches Huly UI behavior.
        yield* client.updateDoc(
          tracker.class.Issue,
          project._id,
          source._id,
          { $pull: { relations: { _id: toRef<Doc>(target._id) } } } as DocumentUpdate<HulyIssue>
        )
        yield* client.updateDoc(
          tracker.class.Issue,
          targetProject._id,
          target._id,
          { $pull: { relations: { _id: toRef<Doc>(source._id) } } } as DocumentUpdate<HulyIssue>
        )
        return { ...result, removed: true }
      }
    }
    /* eslint-enable no-restricted-syntax */
  })

export const listIssueRelations = (
  params: ListIssueRelationsParams
): Effect.Effect<ListIssueRelationsResult, RelationError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue } = yield* findProjectAndIssue({
      project: params.project,
      identifier: params.issueIdentifier
    })

    const blockedByRefs = issue.blockedBy ?? []
    const relationsRefs = issue.relations ?? []
    const allIds = [...blockedByRefs, ...relationsRefs].map(r => r._id)

    if (allIds.length === 0) {
      return { blockedBy: [], relations: [] }
    }

    // Ref<Doc> → Ref<HulyIssue> cast: RelatedDocument stores Ref<Doc>, but we know
    // these are Issue refs because they come from Issue.blockedBy/relations fields
    const toIssueRef = toRef<HulyIssue>
    const issueIds = allIds.map(toIssueRef)
    const issues = yield* client.findAll<HulyIssue>(
      tracker.class.Issue,
      { _id: { $in: issueIds } }
    )

    const idToIdentifier = new Map(issues.map(i => [String(i._id), i.identifier]))

    const toEntry = (r: RelatedDocument): RelationEntry => ({
      identifier: idToIdentifier.get(String(r._id)) ?? String(r._id),
      _id: String(r._id),
      _class: String(r._class)
    })

    return {
      blockedBy: blockedByRefs.map(toEntry),
      relations: relationsRefs.map(toEntry)
    }
  })
