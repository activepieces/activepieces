import { JSONSchema, ParseResult, Schema } from "effect"

import { normalizeForComparison } from "../../utils/normalize.js"
import type { IssueId } from "./shared.js"
import {
  ColorCode,
  ComponentIdentifier,
  Email,
  IssueIdentifier,
  LimitParam,
  NonEmptyString,
  PersonId,
  PersonName,
  PositiveNumber,
  ProjectIdentifier,
  StatusName,
  Timestamp
} from "./shared.js"

export const IssuePriorityValues = ["urgent", "high", "medium", "low", "no-priority"] as const

const IssuePriorityLiteral = Schema.Literal(...IssuePriorityValues)

const normalizedPriorityLookup = new Map(
  IssuePriorityValues.map(v => [normalizeForComparison(v), v] as const)
)

export const IssuePrioritySchema = Schema.transformOrFail(
  Schema.String,
  IssuePriorityLiteral,
  {
    strict: true,
    decode: (input, _options, ast) => {
      const match = normalizedPriorityLookup.get(normalizeForComparison(input))
      return match !== undefined
        ? ParseResult.succeed(match)
        : ParseResult.fail(new ParseResult.Type(ast, input, `Expected one of: ${IssuePriorityValues.join(", ")}`))
    },
    encode: ParseResult.succeed
  }
).annotations({
  title: "IssuePriority",
  description: "Issue priority level",
  jsonSchema: { type: "string", enum: [...IssuePriorityValues] }
})

export type IssuePriority = Schema.Schema.Type<typeof IssuePrioritySchema>

export const LabelSchema = Schema.Struct({
  title: NonEmptyString,
  color: Schema.optional(ColorCode)
}).annotations({
  title: "Label",
  description: "Issue label/tag"
})

export type Label = Schema.Schema.Type<typeof LabelSchema>

export const PersonRefSchema = Schema.Struct({
  id: PersonId,
  name: Schema.optional(PersonName),
  email: Schema.optional(Email)
}).annotations({
  title: "PersonRef",
  description: "Reference to a person (assignee, reporter)"
})

export type PersonRef = Schema.Schema.Type<typeof PersonRefSchema>

export const IssueSummarySchema = Schema.Struct({
  identifier: IssueIdentifier,
  title: Schema.String,
  status: StatusName,
  priority: Schema.optional(IssuePrioritySchema),
  assignee: Schema.optional(PersonName),
  parentIssue: Schema.optional(IssueIdentifier),
  subIssues: Schema.optional(Schema.Number),
  modifiedOn: Schema.optional(Timestamp)
}).annotations({
  title: "IssueSummary",
  description: "Issue summary for list operations"
})

export type IssueSummary = Schema.Schema.Type<typeof IssueSummarySchema>

export const IssueSchema = Schema.Struct({
  identifier: IssueIdentifier,
  title: NonEmptyString,
  description: Schema.optional(Schema.String),
  status: StatusName,
  priority: Schema.optional(IssuePrioritySchema),
  assignee: Schema.optional(PersonName),
  assigneeRef: Schema.optional(PersonRefSchema),
  labels: Schema.optional(Schema.Array(LabelSchema)),
  project: ProjectIdentifier,
  parentIssue: Schema.optional(IssueIdentifier),
  subIssues: Schema.optional(Schema.Number),
  modifiedOn: Schema.optional(Timestamp),
  createdOn: Schema.optional(Timestamp),
  dueDate: Schema.optional(Schema.NullOr(Timestamp)),
  estimation: Schema.optional(PositiveNumber)
}).annotations({
  title: "Issue",
  description: "Full issue with all fields"
})

export type Issue = Schema.Schema.Type<typeof IssueSchema>

const ListIssuesParamsBase = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  status: Schema.optional(StatusName.annotations({
    description: "Filter by status name"
  })),
  assignee: Schema.optional(Email.annotations({
    description: "Filter by assignee email"
  })),
  parentIssue: Schema.optional(IssueIdentifier.annotations({
    description: "Filter to children of this parent issue (e.g., 'HULY-42')"
  })),
  titleSearch: Schema.optional(Schema.String.annotations({
    description: "Search issues by title substring (case-insensitive). Mutually exclusive with titleRegex."
  })),
  titleRegex: Schema.optional(Schema.String.annotations({
    description:
      "Filter issues by title using a regex pattern (e.g., '^BUG'). Mutually exclusive with titleSearch. Note: regex support depends on the Huly backend; use titleSearch for broader compatibility."
  })),
  descriptionSearch: Schema.optional(Schema.String.annotations({
    description: "Search issues by description content (fulltext search)"
  })),
  component: Schema.optional(ComponentIdentifier.annotations({
    description: "Filter by component ID or label"
  })),
  hasAssignee: Schema.optional(Schema.Boolean.annotations({
    description: "Filter by assignee presence. true = only assigned issues, false = only unassigned issues."
  })),
  hasDueDate: Schema.optional(Schema.Boolean.annotations({
    description: "Filter by due date presence. true = only issues with a due date, false = only issues without."
  })),
  hasComponent: Schema.optional(Schema.Boolean.annotations({
    description: "Filter by component presence. true = only issues with a component, false = only issues without."
  })),
  isTopLevel: Schema.optional(Schema.Boolean.annotations({
    description: "When true, only return top-level issues (not sub-issues). false or omitted returns all issues."
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of issues to return (default: 50)"
    })
  )
})

export const ListIssuesParamsSchema = ListIssuesParamsBase.pipe(
  Schema.filter((params) => {
    if (params.titleSearch !== undefined && params.titleRegex !== undefined) {
      return "Cannot provide both 'titleSearch' and 'titleRegex'. Use one or the other."
    }
    if (params.assignee !== undefined && params.hasAssignee !== undefined) {
      return "Cannot provide both 'assignee' and 'hasAssignee'. Use one or the other."
    }
    if (params.component !== undefined && params.hasComponent !== undefined) {
      return "Cannot provide both 'component' and 'hasComponent'. Use one or the other."
    }
    if (params.parentIssue !== undefined && params.isTopLevel === true) {
      return "Cannot provide both 'parentIssue' and 'isTopLevel: true'. parentIssue requests children; isTopLevel requests parentless issues."
    }
    return undefined
  })
).annotations({
  title: "ListIssuesParams",
  description: "Parameters for listing issues"
})

export type ListIssuesParams = Schema.Schema.Type<typeof ListIssuesParamsSchema>

export const GetIssueParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue identifier (e.g., 'HULY-123')"
  })
}).annotations({
  title: "GetIssueParams",
  description: "Parameters for getting a single issue"
})

export type GetIssueParams = Schema.Schema.Type<typeof GetIssueParamsSchema>

export const CreateIssueParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  title: NonEmptyString.annotations({
    description: "Issue title"
  }),
  description: Schema.optional(Schema.String.annotations({
    description: "Issue description (markdown supported)"
  })),
  priority: Schema.optional(IssuePrioritySchema.annotations({
    description: "Issue priority (urgent, high, medium, low, no-priority)"
  })),
  assignee: Schema.optional(Email.annotations({
    description: "Assignee email address"
  })),
  status: Schema.optional(StatusName.annotations({
    description: "Initial status (uses project default if not specified)"
  })),
  parentIssue: Schema.optional(IssueIdentifier.annotations({
    description: "Parent issue identifier (e.g., 'HULY-42') to create as sub-issue"
  }))
}).annotations({
  title: "CreateIssueParams",
  description: "Parameters for creating an issue"
})

export type CreateIssueParams = Schema.Schema.Type<typeof CreateIssueParamsSchema>

export const UpdateIssueParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue identifier (e.g., 'HULY-123')"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "New issue title"
  })),
  description: Schema.optional(Schema.String.annotations({
    description: "New issue description (markdown supported)"
  })),
  priority: Schema.optional(IssuePrioritySchema.annotations({
    description: "New issue priority"
  })),
  assignee: Schema.optional(
    Schema.NullOr(Email).annotations({
      description: "New assignee email (null to unassign)"
    })
  ),
  status: Schema.optional(StatusName.annotations({
    description: "New status"
  }))
}).annotations({
  title: "UpdateIssueParams",
  description: "Parameters for updating an issue"
})

export type UpdateIssueParams = Schema.Schema.Type<typeof UpdateIssueParamsSchema>

export const AddLabelParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue identifier (e.g., 'HULY-123')"
  }),
  label: NonEmptyString.annotations({
    description: "Label name to add"
  }),
  color: Schema.optional(
    ColorCode.annotations({
      description: "Color code (0-9, default: 0)"
    })
  )
}).annotations({
  title: "AddLabelParams",
  description: "Parameters for adding a label to an issue"
})

export type AddLabelParams = Schema.Schema.Type<typeof AddLabelParamsSchema>

export const DeleteIssueParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue identifier (e.g., 'HULY-123')"
  })
}).annotations({
  title: "DeleteIssueParams",
  description: "Parameters for deleting an issue"
})

export type DeleteIssueParams = Schema.Schema.Type<typeof DeleteIssueParamsSchema>

export const RemoveLabelParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue identifier (e.g., 'HULY-123')"
  }),
  label: NonEmptyString.annotations({
    description: "Label name to remove"
  })
}).annotations({
  title: "RemoveLabelParams",
  description: "Parameters for removing a label from an issue"
})

export type RemoveLabelParams = Schema.Schema.Type<typeof RemoveLabelParamsSchema>

export const MoveIssueParamsSchema = Schema.Struct({
  project: ProjectIdentifier.annotations({
    description: "Project identifier (e.g., 'HULY')"
  }),
  identifier: IssueIdentifier.annotations({
    description: "Issue to move (e.g., 'HULY-123')"
  }),
  newParent: Schema.NullOr(IssueIdentifier).annotations({
    description: "New parent issue identifier, or null to make top-level"
  })
}).annotations({
  title: "MoveIssueParams",
  description: "Parameters for moving an issue to a new parent or to top-level"
})

export type MoveIssueParams = Schema.Schema.Type<typeof MoveIssueParamsSchema>

export const listIssuesParamsJsonSchema = JSONSchema.make(ListIssuesParamsSchema)
export const getIssueParamsJsonSchema = JSONSchema.make(GetIssueParamsSchema)
export const createIssueParamsJsonSchema = JSONSchema.make(CreateIssueParamsSchema)
export const updateIssueParamsJsonSchema = JSONSchema.make(UpdateIssueParamsSchema)
export const addLabelParamsJsonSchema = JSONSchema.make(AddLabelParamsSchema)
export const removeLabelParamsJsonSchema = JSONSchema.make(RemoveLabelParamsSchema)
export const deleteIssueParamsJsonSchema = JSONSchema.make(DeleteIssueParamsSchema)
export const moveIssueParamsJsonSchema = JSONSchema.make(MoveIssueParamsSchema)

export const parseIssue = Schema.decodeUnknown(IssueSchema)
export const parseIssueSummary = Schema.decodeUnknown(IssueSummarySchema)
export const parseListIssuesParams = Schema.decodeUnknown(ListIssuesParamsSchema)
export const parseGetIssueParams = Schema.decodeUnknown(GetIssueParamsSchema)
export const parseCreateIssueParams = Schema.decodeUnknown(CreateIssueParamsSchema)
export const parseUpdateIssueParams = Schema.decodeUnknown(UpdateIssueParamsSchema)
export const parseAddLabelParams = Schema.decodeUnknown(AddLabelParamsSchema)
export const parseRemoveLabelParams = Schema.decodeUnknown(RemoveLabelParamsSchema)
export const parseDeleteIssueParams = Schema.decodeUnknown(DeleteIssueParamsSchema)
export const parseMoveIssueParams = Schema.decodeUnknown(MoveIssueParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface CreateIssueResult {
  readonly identifier: IssueIdentifier
  readonly issueId: IssueId
}

export interface UpdateIssueResult {
  readonly identifier: IssueIdentifier
  readonly updated: boolean
}

export interface AddLabelResult {
  readonly identifier: IssueIdentifier
  readonly labelAdded: boolean
}

export interface RemoveLabelResult {
  readonly identifier: IssueIdentifier
  readonly labelRemoved: boolean
}

export interface DeleteIssueResult {
  readonly identifier: IssueIdentifier
  readonly deleted: boolean
}

export interface MoveIssueResult {
  readonly identifier: IssueIdentifier
  readonly moved: boolean
  readonly newParent?: IssueIdentifier
}
