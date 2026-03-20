import { JSONSchema, Schema } from "effect"

import { IssuePrioritySchema } from "./issues.js"
import type { IssueId, IssueIdentifier } from "./shared.js"
import {
  ComponentIdentifier,
  ComponentLabel,
  Email,
  IssueTemplateChildId,
  IssueTemplateId,
  LimitParam,
  NonEmptyString,
  PersonName,
  PositiveNumber,
  ProjectIdentifier,
  StatusName,
  TemplateIdentifier,
  Timestamp
} from "./shared.js"

// --- Child template schemas ---

export const IssueTemplateChildSchema = Schema.Struct({
  id: IssueTemplateChildId,
  title: NonEmptyString,
  description: Schema.optional(Schema.String),
  priority: Schema.optional(IssuePrioritySchema),
  assignee: Schema.optional(PersonName),
  component: Schema.optional(ComponentLabel),
  estimation: Schema.optional(PositiveNumber)
}).annotations({
  title: "IssueTemplateChild",
  description: "A child (sub-task) template within an issue template"
})

export type IssueTemplateChild = Schema.Schema.Type<typeof IssueTemplateChildSchema>

/** Shared fields for child template input (used by both inline children and add_template_child). */
const ChildTemplateFieldsSchema = Schema.Struct({
  title: NonEmptyString.annotations({
    description: "Child template title"
  }),
  description: Schema.optional(Schema.String.annotations({
    description: "Child template description"
  })),
  priority: Schema.optional(IssuePrioritySchema.annotations({
    description: "Child default priority"
  })),
  assignee: Schema.optional(Email.annotations({
    description: "Child default assignee email"
  })),
  component: Schema.optional(ComponentIdentifier.annotations({
    description: "Child default component ID or label"
  })),
  estimation: Schema.optional(PositiveNumber.annotations({
    description: "Child default estimation in minutes"
  }))
})

export const ChildTemplateInputSchema = ChildTemplateFieldsSchema.annotations({
  title: "ChildTemplateInput",
  description: "Input for creating a child template within an issue template"
})

export type ChildTemplateInput = Schema.Schema.Type<typeof ChildTemplateInputSchema>

// --- Summary / detail schemas ---

export const IssueTemplateSummarySchema = Schema.Struct({
  id: IssueTemplateId,
  title: NonEmptyString,
  priority: Schema.optional(IssuePrioritySchema),
  childrenCount: Schema.optional(Schema.Number),
  modifiedOn: Schema.optional(Timestamp)
}).annotations({
  title: "IssueTemplateSummary",
  description: "Issue template summary for list operations"
})

export type IssueTemplateSummary = Schema.Schema.Type<typeof IssueTemplateSummarySchema>

export const IssueTemplateSchema = Schema.Struct({
  id: IssueTemplateId,
  title: NonEmptyString,
  description: Schema.optional(Schema.String),
  priority: Schema.optional(IssuePrioritySchema),
  assignee: Schema.optional(PersonName),
  component: Schema.optional(ComponentLabel),
  estimation: Schema.optional(PositiveNumber),
  children: Schema.optional(Schema.Array(IssueTemplateChildSchema)),
  project: ProjectIdentifier,
  modifiedOn: Schema.optional(Timestamp),
  createdOn: Schema.optional(Timestamp)
}).annotations({
  title: "IssueTemplate",
  description: "Full issue template with all fields including children"
})

export type IssueTemplate = Schema.Schema.Type<typeof IssueTemplateSchema>

// --- Params schemas ---

export const ListIssueTemplatesParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of templates to return (default: 50)"
    })
  )
}).annotations({
  title: "ListIssueTemplatesParams",
  description: "Parameters for listing issue templates"
})

export type ListIssueTemplatesParams = Schema.Schema.Type<typeof ListIssueTemplatesParamsSchema>

export const GetIssueTemplateParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  template: TemplateIdentifier.annotations({
    description: "Template ID or title"
  })
}).annotations({
  title: "GetIssueTemplateParams",
  description: "Parameters for getting a single issue template"
})

export type GetIssueTemplateParams = Schema.Schema.Type<typeof GetIssueTemplateParamsSchema>

export const CreateIssueTemplateParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  title: NonEmptyString.annotations({
    description: "Template title"
  }),
  description: Schema.optional(Schema.String.annotations({
    description: "Template description (markdown supported)"
  })),
  priority: Schema.optional(IssuePrioritySchema.annotations({
    description: "Default priority for issues created from this template"
  })),
  assignee: Schema.optional(Email.annotations({
    description: "Default assignee email address"
  })),
  component: Schema.optional(ComponentIdentifier.annotations({
    description: "Default component ID or label"
  })),
  estimation: Schema.optional(PositiveNumber.annotations({
    description: "Default estimation in minutes"
  })),
  children: Schema.optional(
    Schema.Array(ChildTemplateInputSchema).annotations({
      description: "Child (sub-task) templates to include"
    })
  )
}).annotations({
  title: "CreateIssueTemplateParams",
  description: "Parameters for creating an issue template"
})

export type CreateIssueTemplateParams = Schema.Schema.Type<typeof CreateIssueTemplateParamsSchema>

export const CreateIssueFromTemplateParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  template: TemplateIdentifier.annotations({
    description: "Template ID or title"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "Override title (uses template title if not specified)"
  })),
  description: Schema.optional(Schema.String.annotations({
    description: "Override description (uses template description if not specified)"
  })),
  priority: Schema.optional(IssuePrioritySchema.annotations({
    description: "Override priority"
  })),
  assignee: Schema.optional(Email.annotations({
    description: "Override assignee email"
  })),
  status: Schema.optional(StatusName.annotations({
    description: "Initial status (uses project default if not specified)"
  })),
  includeChildren: Schema.optional(Schema.Boolean.annotations({
    description: "Whether to create sub-issues from template children (default: true)"
  }))
}).annotations({
  title: "CreateIssueFromTemplateParams",
  description: "Parameters for creating an issue from a template"
})

export type CreateIssueFromTemplateParams = Schema.Schema.Type<typeof CreateIssueFromTemplateParamsSchema>

export const UpdateIssueTemplateParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  template: TemplateIdentifier.annotations({
    description: "Template ID or title"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "New template title"
  })),
  description: Schema.optional(Schema.String.annotations({
    description: "New template description (markdown supported)"
  })),
  priority: Schema.optional(IssuePrioritySchema.annotations({
    description: "New default priority"
  })),
  assignee: Schema.optional(
    Schema.NullOr(Email).annotations({
      description: "New default assignee email (null to unassign)"
    })
  ),
  component: Schema.optional(
    Schema.NullOr(ComponentIdentifier).annotations({
      description: "New default component ID or label (null to clear)"
    })
  ),
  estimation: Schema.optional(PositiveNumber.annotations({
    description: "New default estimation in minutes"
  }))
}).annotations({
  title: "UpdateIssueTemplateParams",
  description: "Parameters for updating an issue template"
})

export type UpdateIssueTemplateParams = Schema.Schema.Type<typeof UpdateIssueTemplateParamsSchema>

export const DeleteIssueTemplateParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  template: TemplateIdentifier.annotations({
    description: "Template ID or title"
  })
}).annotations({
  title: "DeleteIssueTemplateParams",
  description: "Parameters for deleting an issue template"
})

export type DeleteIssueTemplateParams = Schema.Schema.Type<typeof DeleteIssueTemplateParamsSchema>

export const AddTemplateChildParamsSchema = Schema.extend(
  ChildTemplateFieldsSchema,
  Schema.Struct({
    project: ProjectIdentifier.annotations({
      description: "Project identifier (e.g., 'HULY')"
    }),
    template: TemplateIdentifier.annotations({
      description: "Template ID or title"
    })
  })
).annotations({
  title: "AddTemplateChildParams",
  description: "Parameters for adding a child template to an issue template"
})

export type AddTemplateChildParams = Schema.Schema.Type<typeof AddTemplateChildParamsSchema>

export const RemoveTemplateChildParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  template: TemplateIdentifier.annotations({
    description: "Template ID or title"
  }),
  childId: IssueTemplateChildId.annotations({
    description: "ID of the child template to remove"
  })
}).annotations({
  title: "RemoveTemplateChildParams",
  description: "Parameters for removing a child template from an issue template"
})

export type RemoveTemplateChildParams = Schema.Schema.Type<typeof RemoveTemplateChildParamsSchema>

// --- JSON schemas ---

export const listIssueTemplatesParamsJsonSchema = JSONSchema.make(ListIssueTemplatesParamsSchema)
export const getIssueTemplateParamsJsonSchema = JSONSchema.make(GetIssueTemplateParamsSchema)
export const createIssueTemplateParamsJsonSchema = JSONSchema.make(CreateIssueTemplateParamsSchema)
export const createIssueFromTemplateParamsJsonSchema = JSONSchema.make(CreateIssueFromTemplateParamsSchema)
export const updateIssueTemplateParamsJsonSchema = JSONSchema.make(UpdateIssueTemplateParamsSchema)
export const deleteIssueTemplateParamsJsonSchema = JSONSchema.make(DeleteIssueTemplateParamsSchema)
export const addTemplateChildParamsJsonSchema = JSONSchema.make(AddTemplateChildParamsSchema)
export const removeTemplateChildParamsJsonSchema = JSONSchema.make(RemoveTemplateChildParamsSchema)

// --- Parsers ---

export const parseIssueTemplate = Schema.decodeUnknown(IssueTemplateSchema)
export const parseIssueTemplateSummary = Schema.decodeUnknown(IssueTemplateSummarySchema)
export const parseListIssueTemplatesParams = Schema.decodeUnknown(ListIssueTemplatesParamsSchema)
export const parseGetIssueTemplateParams = Schema.decodeUnknown(GetIssueTemplateParamsSchema)
export const parseCreateIssueTemplateParams = Schema.decodeUnknown(CreateIssueTemplateParamsSchema)
export const parseCreateIssueFromTemplateParams = Schema.decodeUnknown(CreateIssueFromTemplateParamsSchema)
export const parseUpdateIssueTemplateParams = Schema.decodeUnknown(UpdateIssueTemplateParamsSchema)
export const parseDeleteIssueTemplateParams = Schema.decodeUnknown(DeleteIssueTemplateParamsSchema)
export const parseAddTemplateChildParams = Schema.decodeUnknown(AddTemplateChildParamsSchema)
export const parseRemoveTemplateChildParams = Schema.decodeUnknown(RemoveTemplateChildParamsSchema)

// No codec needed — internal type, not used for runtime validation

export interface CreateIssueTemplateResult {
  readonly id: IssueTemplateId
  readonly title: string
}

export interface UpdateIssueTemplateResult {
  readonly id: IssueTemplateId
  readonly updated: boolean
}

export interface DeleteIssueTemplateResult {
  readonly id: IssueTemplateId
  readonly deleted: boolean
}

export interface CreateIssueFromTemplateResult {
  readonly identifier: IssueIdentifier
  readonly issueId: IssueId
  readonly childrenCreated?: number
}

export interface AddTemplateChildResult {
  readonly id: IssueTemplateChildId
  readonly title: string
  readonly added: boolean
}

export interface RemoveTemplateChildResult {
  readonly id: IssueTemplateChildId
  readonly title: string
  readonly removed: boolean
}
