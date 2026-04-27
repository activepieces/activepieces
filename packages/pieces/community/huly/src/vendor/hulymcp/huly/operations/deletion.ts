import type {
  Component as HulyComponent,
  Issue as HulyIssue,
  IssueTemplate as HulyIssueTemplate,
  Milestone as HulyMilestone
} from "@hcengineering/tracker"
import { Effect } from "effect"

import type { DeletionImpact, PreviewDeletionParams } from "../../domain/schemas/deletion.js"
import type { HulyClient, HulyClientError } from "../client.js"
import {
  ComponentNotFoundError,
  type IssueNotFoundError,
  MilestoneNotFoundError,
  type ProjectNotFoundError
} from "../errors.js"
import { tracker } from "../huly-plugins.js"
import { findComponentByIdOrLabel } from "./components.js"
import { findByNameOrId, findProject, findProjectAndIssue, toRef } from "./shared.js"

type PreviewDeletionError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | ComponentNotFoundError
  | MilestoneNotFoundError

const previewIssueDeletion = (
  params: PreviewDeletionParams & { identifier: string }
): Effect.Effect<DeletionImpact, PreviewDeletionError, HulyClient> =>
  Effect.gen(function*() {
    const { issue } = yield* findProjectAndIssue({
      project: params.project,
      identifier: params.identifier
    })

    const subIssues = issue.subIssues
    const comments = issue.comments ?? 0
    const attachments = issue.attachments ?? 0
    const blockedBy = issue.blockedBy?.length ?? 0
    const relations = issue.relations?.length ?? 0

    const warnings: Array<string> = []
    if (subIssues > 0) warnings.push(`Has ${subIssues} sub-issue${subIssues > 1 ? "s" : ""} that will be orphaned`)
    if (blockedBy > 0) {
      warnings.push(
        `Blocked by ${blockedBy} other issue${blockedBy > 1 ? "s" : ""} — blocking relations will be removed`
      )
    }
    if (relations > 0) warnings.push(`Has ${relations} relation${relations > 1 ? "s" : ""} to other issues`)
    if (comments > 0) warnings.push(`Has ${comments} comment${comments > 1 ? "s" : ""} that will be deleted`)
    if (attachments > 0) {
      warnings.push(`Has ${attachments} attachment${attachments > 1 ? "s" : ""} that will be deleted`)
    }

    const totalAffected = subIssues + comments + attachments + blockedBy + relations

    return {
      entityType: "issue" as const,
      identifier: issue.identifier,
      impact: { subIssues, comments, attachments, blockedBy, relations },
      warnings,
      totalAffected
    }
  })

const previewProjectDeletion = (
  params: PreviewDeletionParams
): Effect.Effect<DeletionImpact, PreviewDeletionError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const [issues, components, milestones, templates] = yield* Effect.all([
      client.findAll<HulyIssue>(
        tracker.class.Issue,
        { space: project._id },
        { limit: 1, total: true }
      ),
      client.findAll<HulyComponent>(
        tracker.class.Component,
        { space: project._id },
        { limit: 1, total: true }
      ),
      client.findAll<HulyMilestone>(
        tracker.class.Milestone,
        { space: project._id },
        { limit: 1, total: true }
      ),
      client.findAll<HulyIssueTemplate>(
        tracker.class.IssueTemplate,
        { space: project._id },
        { limit: 1, total: true }
      )
    ])

    const issueCount = issues.total
    const componentCount = components.total
    const milestoneCount = milestones.total
    const templateCount = templates.total

    const warnings: Array<string> = []
    if (issueCount > 0) warnings.push(`Contains ${issueCount} issue${issueCount > 1 ? "s" : ""} that will be deleted`)
    if (componentCount > 0) {
      warnings.push(`Contains ${componentCount} component${componentCount > 1 ? "s" : ""} that will be deleted`)
    }
    if (milestoneCount > 0) {
      warnings.push(`Contains ${milestoneCount} milestone${milestoneCount > 1 ? "s" : ""} that will be deleted`)
    }
    if (templateCount > 0) {
      warnings.push(`Contains ${templateCount} template${templateCount > 1 ? "s" : ""} that will be deleted`)
    }

    const totalAffected = issueCount + componentCount + milestoneCount + templateCount

    return {
      entityType: "project" as const,
      identifier: project.identifier,
      impact: {
        issues: issueCount,
        components: componentCount,
        milestones: milestoneCount,
        templates: templateCount
      },
      warnings,
      totalAffected
    }
  })

const previewComponentDeletion = (
  params: PreviewDeletionParams & { identifier: string }
): Effect.Effect<DeletionImpact, PreviewDeletionError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const component = yield* findComponentByIdOrLabel(client, project._id, params.identifier)
    if (component === undefined) {
      return yield* new ComponentNotFoundError({ identifier: params.identifier, project: params.project })
    }

    const issues = yield* client.findAll<HulyIssue>(
      tracker.class.Issue,
      { space: project._id, component: component._id },
      { limit: 1, total: true }
    )

    const issueCount = issues.total

    const warnings: Array<string> = []
    if (issueCount > 0) {
      warnings.push(
        `${issueCount} issue${issueCount > 1 ? "s" : ""} use${issueCount === 1 ? "s" : ""} this component`
      )
    }

    return {
      entityType: "component" as const,
      identifier: component.label,
      impact: { issues: issueCount },
      warnings,
      totalAffected: issueCount
    }
  })

const previewMilestoneDeletion = (
  params: PreviewDeletionParams & { identifier: string }
): Effect.Effect<DeletionImpact, PreviewDeletionError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const milestone = yield* findByNameOrId(
      client,
      tracker.class.Milestone,
      { space: project._id, _id: toRef<HulyMilestone>(params.identifier) },
      { space: project._id, label: params.identifier }
    )
    if (milestone === undefined) {
      return yield* new MilestoneNotFoundError({ identifier: params.identifier, project: params.project })
    }

    const issues = yield* client.findAll<HulyIssue>(
      tracker.class.Issue,
      { space: project._id, milestone: milestone._id },
      { limit: 1, total: true }
    )

    const issueCount = issues.total

    const warnings: Array<string> = []
    if (issueCount > 0) {
      warnings.push(
        `${issueCount} issue${issueCount > 1 ? "s" : ""} ${issueCount === 1 ? "is" : "are"} in this milestone`
      )
    }

    return {
      entityType: "milestone" as const,
      identifier: milestone.label,
      impact: { issues: issueCount },
      warnings,
      totalAffected: issueCount
    }
  })

// Schema.filter on PreviewDeletionParamsSchema guarantees `identifier` is defined for non-project types.
// TypeScript can't narrow filtered Schema types, so the cast is necessary here.
type WithIdentifier = PreviewDeletionParams & { identifier: string }

export const previewDeletion = (
  params: PreviewDeletionParams
): Effect.Effect<DeletionImpact, PreviewDeletionError, HulyClient> => {
  /* eslint-disable no-restricted-syntax -- see comment on WithIdentifier above */
  switch (params.entityType) {
    case "issue":
      return previewIssueDeletion(params as WithIdentifier)
    case "project":
      return previewProjectDeletion(params)
    case "component":
      return previewComponentDeletion(params as WithIdentifier)
    case "milestone":
      return previewMilestoneDeletion(params as WithIdentifier)
  }
  /* eslint-enable no-restricted-syntax */
}
