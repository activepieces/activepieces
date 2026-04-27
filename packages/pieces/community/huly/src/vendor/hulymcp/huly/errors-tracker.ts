/**
 * Tracker domain errors: issues, projects, statuses, milestones, components, templates.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Issue not found in the specified project.
 */
export class IssueNotFoundError extends Schema.TaggedError<IssueNotFoundError>()(
  "IssueNotFoundError",
  {
    identifier: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Issue '${this.identifier}' not found in project '${this.project}'`
  }
}

/**
 * Project not found in the workspace.
 */
export class ProjectNotFoundError extends Schema.TaggedError<ProjectNotFoundError>()(
  "ProjectNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Project '${this.identifier}' not found`
  }
}

/**
 * Invalid status for the given project.
 */
export class InvalidStatusError extends Schema.TaggedError<InvalidStatusError>()(
  "InvalidStatusError",
  {
    status: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Invalid status '${this.status}' for project '${this.project}'`
  }
}

/**
 * Comment not found on the specified issue.
 */
export class CommentNotFoundError extends Schema.TaggedError<CommentNotFoundError>()(
  "CommentNotFoundError",
  {
    commentId: Schema.String,
    issueIdentifier: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Comment '${this.commentId}' not found on issue '${this.issueIdentifier}' in project '${this.project}'`
  }
}

/**
 * Milestone not found in the specified project.
 */
export class MilestoneNotFoundError extends Schema.TaggedError<MilestoneNotFoundError>()(
  "MilestoneNotFoundError",
  {
    identifier: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Milestone '${this.identifier}' not found in project '${this.project}'`
  }
}

export class ComponentNotFoundError extends Schema.TaggedError<ComponentNotFoundError>()(
  "ComponentNotFoundError",
  {
    identifier: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Component '${this.identifier}' not found in project '${this.project}'`
  }
}

/**
 * Issue template not found in the specified project.
 */
export class IssueTemplateNotFoundError extends Schema.TaggedError<IssueTemplateNotFoundError>()(
  "IssueTemplateNotFoundError",
  {
    identifier: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Issue template '${this.identifier}' not found in project '${this.project}'`
  }
}

/**
 * Child template not found within an issue template.
 */
export class TemplateChildNotFoundError extends Schema.TaggedError<TemplateChildNotFoundError>()(
  "TemplateChildNotFoundError",
  {
    childId: Schema.String,
    template: Schema.String,
    project: Schema.String
  }
) {
  override get message(): string {
    return `Child template '${this.childId}' not found in template '${this.template}' of project '${this.project}'`
  }
}
