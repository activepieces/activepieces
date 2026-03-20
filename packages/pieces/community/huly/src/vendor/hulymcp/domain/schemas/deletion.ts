import { JSONSchema, Schema } from "effect"

import { ProjectIdentifier } from "./shared.js"

const EntityTypeValues = ["issue", "project", "component", "milestone"] as const

const EntityTypeSchema = Schema.Literal(...EntityTypeValues).annotations({
  title: "EntityType",
  description: "Type of entity to preview deletion for"
})

export type EntityType = Schema.Schema.Type<typeof EntityTypeSchema>

export const PreviewDeletionParamsSchema = Schema.Struct({
  entityType: EntityTypeSchema.annotations({
    description: "Type of entity: issue, project, component, or milestone"
  }),
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY'). For entityType='project', this IS the target project."
  }),
  identifier: Schema.optional(Schema.String).annotations({
    description:
      "Entity identifier within the project. Required for issue (e.g., 'PROJ-123' or number), component (label or ID), milestone (label or ID). Ignored for entityType='project'."
  })
}).pipe(
  Schema.filter((params) => {
    if (params.entityType !== "project" && (params.identifier === undefined || params.identifier.trim() === "")) {
      return {
        path: ["identifier"],
        message: `identifier is required when entityType is '${params.entityType}'`
      }
    }
    return undefined
  })
).annotations({
  title: "PreviewDeletionParams",
  description: "Parameters for previewing deletion impact"
})

export type PreviewDeletionParams = Schema.Schema.Type<typeof PreviewDeletionParamsSchema>

// No codec needed — internal type, not used for runtime validation
export interface DeletionImpact {
  readonly entityType: EntityType
  readonly identifier: string
  readonly impact: {
    readonly subIssues?: number | undefined
    readonly comments?: number | undefined
    readonly attachments?: number | undefined
    readonly blockedBy?: number | undefined
    readonly relations?: number | undefined
    readonly issues?: number | undefined
    readonly components?: number | undefined
    readonly milestones?: number | undefined
    readonly templates?: number | undefined
  }
  readonly warnings: ReadonlyArray<string>
  readonly totalAffected: number
}

export const previewDeletionParamsJsonSchema = JSONSchema.make(PreviewDeletionParamsSchema)
export const parsePreviewDeletionParams = Schema.decodeUnknown(PreviewDeletionParamsSchema)
