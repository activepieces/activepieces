import { JSONSchema, Schema } from "effect"

import type { TestCaseId, TestProjectId, TestSuiteId } from "./shared.js"
import { LimitParam, NonEmptyString, TestCaseIdentifier, TestProjectIdentifier, TestSuiteIdentifier } from "./shared.js"

// --- Enum value arrays and schemas ---

export const TestCaseTypeValues = ["functional", "performance", "regression", "security", "smoke", "usability"] as const
export type TestCaseTypeStr = (typeof TestCaseTypeValues)[number]
export const TestCaseTypeSchema = Schema.Literal(...TestCaseTypeValues).annotations({
  description: "Test case type: functional, performance, regression, security, smoke, usability"
})

export const TestCasePriorityValues = ["low", "medium", "high", "urgent"] as const
export type TestCasePriorityStr = (typeof TestCasePriorityValues)[number]
export const TestCasePrioritySchema = Schema.Literal(...TestCasePriorityValues).annotations({
  description: "Test case priority: low, medium, high, urgent"
})

export const TestCaseStatusValues = [
  "draft",
  "ready-for-review",
  "fix-review-comments",
  "approved",
  "rejected"
] as const
export type TestCaseStatusStr = (typeof TestCaseStatusValues)[number]
export const TestCaseStatusSchema = Schema.Literal(...TestCaseStatusValues).annotations({
  description: "Test case status: draft, ready-for-review, fix-review-comments, approved, rejected"
})

export const TestRunStatusValues = ["untested", "blocked", "passed", "failed"] as const
export type TestRunStatusStr = (typeof TestRunStatusValues)[number]
export const TestRunStatusSchema = Schema.Literal(...TestRunStatusValues).annotations({
  description: "Test run result status: untested, blocked, passed, failed"
})

// --- Summary types ---

export interface TestProjectSummary {
  readonly id: TestProjectId
  readonly name: string
  readonly description?: string
  readonly archived: boolean
}

export interface TestSuiteSummary {
  readonly id: TestSuiteId
  readonly name: string
  readonly description?: string
  readonly parent?: string
}

export interface TestCaseSummary {
  readonly id: TestCaseId
  readonly name: string
  readonly type: TestCaseTypeStr
  readonly priority: TestCasePriorityStr
  readonly status: TestCaseStatusStr
  readonly assignee?: string
}

// --- Params schemas ---

export const ListTestProjectsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of projects to return (default: 50)"
    })
  )
}).annotations({
  title: "ListTestProjectsParams",
  description: "Parameters for listing test management projects"
})

export type ListTestProjectsParams = Schema.Schema.Type<typeof ListTestProjectsParamsSchema>

export const ListTestSuitesParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  parent: Schema.optional(
    TestSuiteIdentifier.annotations({
      description: "Filter by parent suite ID or name. Only returns direct children of this suite."
    })
  ),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of suites to return (default: 50)"
    })
  )
}).annotations({
  title: "ListTestSuitesParams",
  description: "Parameters for listing test suites in a project"
})

export type ListTestSuitesParams = Schema.Schema.Type<typeof ListTestSuitesParamsSchema>

export const GetTestSuiteParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  suite: TestSuiteIdentifier.annotations({
    description: "Test suite ID or name"
  })
}).annotations({
  title: "GetTestSuiteParams",
  description: "Parameters for getting a single test suite"
})

export type GetTestSuiteParams = Schema.Schema.Type<typeof GetTestSuiteParamsSchema>

export const CreateTestSuiteParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  name: NonEmptyString.annotations({
    description: "Suite name"
  }),
  description: Schema.optional(
    Schema.String.annotations({
      description: "Suite description"
    })
  ),
  parent: Schema.optional(
    TestSuiteIdentifier.annotations({
      description: "Parent suite ID or name for nesting"
    })
  )
}).annotations({
  title: "CreateTestSuiteParams",
  description:
    "Parameters for creating a test suite. Idempotent: returns existing suite if one with the same name exists in the project (created=false)."
})

export type CreateTestSuiteParams = Schema.Schema.Type<typeof CreateTestSuiteParamsSchema>

export const UpdateTestSuiteParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  suite: TestSuiteIdentifier.annotations({
    description: "Test suite ID or name to update"
  }),
  name: Schema.optional(
    NonEmptyString.annotations({
      description: "New suite name"
    })
  ),
  description: Schema.optional(
    Schema.NullOr(Schema.String).annotations({
      description: "New suite description (null to clear)"
    })
  )
}).annotations({
  title: "UpdateTestSuiteParams",
  description: "Parameters for updating a test suite. Only provided fields are modified."
})

export type UpdateTestSuiteParams = Schema.Schema.Type<typeof UpdateTestSuiteParamsSchema>

export const DeleteTestSuiteParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  suite: TestSuiteIdentifier.annotations({
    description: "Test suite ID or name to delete"
  })
}).annotations({
  title: "DeleteTestSuiteParams",
  description: "Parameters for deleting a test suite"
})

export type DeleteTestSuiteParams = Schema.Schema.Type<typeof DeleteTestSuiteParamsSchema>

export const ListTestCasesParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  suite: Schema.optional(
    TestSuiteIdentifier.annotations({
      description: "Filter by suite ID or name"
    })
  ),
  assignee: Schema.optional(
    NonEmptyString.annotations({
      description: "Filter by assignee name or email"
    })
  ),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of test cases to return (default: 50)"
    })
  )
}).annotations({
  title: "ListTestCasesParams",
  description: "Parameters for listing test cases in a project"
})

export type ListTestCasesParams = Schema.Schema.Type<typeof ListTestCasesParamsSchema>

export const GetTestCaseParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  testCase: TestCaseIdentifier.annotations({
    description: "Test case ID or name"
  })
}).annotations({
  title: "GetTestCaseParams",
  description: "Parameters for getting a single test case"
})

export type GetTestCaseParams = Schema.Schema.Type<typeof GetTestCaseParamsSchema>

export const CreateTestCaseParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  suite: TestSuiteIdentifier.annotations({
    description: "Suite ID or name to attach the test case to"
  }),
  name: NonEmptyString.annotations({
    description: "Test case name"
  }),
  description: Schema.optional(
    Schema.String.annotations({
      description: "Test case description"
    })
  ),
  type: Schema.optional(
    TestCaseTypeSchema.annotations({
      description: "Test case type (default: functional)"
    })
  ),
  priority: Schema.optional(
    TestCasePrioritySchema.annotations({
      description: "Test case priority (default: medium)"
    })
  ),
  status: Schema.optional(
    TestCaseStatusSchema.annotations({
      description: "Test case status (default: draft)"
    })
  ),
  assignee: Schema.optional(
    NonEmptyString.annotations({
      description: "Assignee name or email"
    })
  )
}).annotations({
  title: "CreateTestCaseParams",
  description: "Parameters for creating a test case attached to a suite"
})

export type CreateTestCaseParams = Schema.Schema.Type<typeof CreateTestCaseParamsSchema>

export const UpdateTestCaseParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  testCase: TestCaseIdentifier.annotations({
    description: "Test case ID or name to update"
  }),
  name: Schema.optional(
    NonEmptyString.annotations({
      description: "New test case name"
    })
  ),
  description: Schema.optional(
    Schema.NullOr(Schema.String).annotations({
      description: "New description (null to clear)"
    })
  ),
  type: Schema.optional(
    TestCaseTypeSchema.annotations({
      description: "New test case type"
    })
  ),
  priority: Schema.optional(
    TestCasePrioritySchema.annotations({
      description: "New priority"
    })
  ),
  status: Schema.optional(
    TestCaseStatusSchema.annotations({
      description: "New status"
    })
  ),
  assignee: Schema.optional(
    Schema.NullOr(NonEmptyString).annotations({
      description: "New assignee name or email (null to unassign)"
    })
  )
}).annotations({
  title: "UpdateTestCaseParams",
  description: "Parameters for updating a test case. Only provided fields are modified."
})

export type UpdateTestCaseParams = Schema.Schema.Type<typeof UpdateTestCaseParamsSchema>

export const DeleteTestCaseParamsSchema = Schema.Struct({
  project: TestProjectIdentifier.annotations({
    description: "Test project ID or name"
  }),
  testCase: TestCaseIdentifier.annotations({
    description: "Test case ID or name to delete"
  })
}).annotations({
  title: "DeleteTestCaseParams",
  description: "Parameters for deleting a test case"
})

export type DeleteTestCaseParams = Schema.Schema.Type<typeof DeleteTestCaseParamsSchema>

// --- JSON schemas ---

export const listTestProjectsParamsJsonSchema = JSONSchema.make(ListTestProjectsParamsSchema)
export const listTestSuitesParamsJsonSchema = JSONSchema.make(ListTestSuitesParamsSchema)
export const getTestSuiteParamsJsonSchema = JSONSchema.make(GetTestSuiteParamsSchema)
export const createTestSuiteParamsJsonSchema = JSONSchema.make(CreateTestSuiteParamsSchema)
export const updateTestSuiteParamsJsonSchema = JSONSchema.make(UpdateTestSuiteParamsSchema)
export const deleteTestSuiteParamsJsonSchema = JSONSchema.make(DeleteTestSuiteParamsSchema)
export const listTestCasesParamsJsonSchema = JSONSchema.make(ListTestCasesParamsSchema)
export const getTestCaseParamsJsonSchema = JSONSchema.make(GetTestCaseParamsSchema)
export const createTestCaseParamsJsonSchema = JSONSchema.make(CreateTestCaseParamsSchema)
export const updateTestCaseParamsJsonSchema = JSONSchema.make(UpdateTestCaseParamsSchema)
export const deleteTestCaseParamsJsonSchema = JSONSchema.make(DeleteTestCaseParamsSchema)

// --- Parse functions ---

export const parseListTestProjectsParams = Schema.decodeUnknown(ListTestProjectsParamsSchema)
export const parseListTestSuitesParams = Schema.decodeUnknown(ListTestSuitesParamsSchema)
export const parseGetTestSuiteParams = Schema.decodeUnknown(GetTestSuiteParamsSchema)
export const parseCreateTestSuiteParams = Schema.decodeUnknown(CreateTestSuiteParamsSchema)
export const parseUpdateTestSuiteParams = Schema.decodeUnknown(UpdateTestSuiteParamsSchema)
export const parseDeleteTestSuiteParams = Schema.decodeUnknown(DeleteTestSuiteParamsSchema)
export const parseListTestCasesParams = Schema.decodeUnknown(ListTestCasesParamsSchema)
export const parseGetTestCaseParams = Schema.decodeUnknown(GetTestCaseParamsSchema)
export const parseCreateTestCaseParams = Schema.decodeUnknown(CreateTestCaseParamsSchema)
export const parseUpdateTestCaseParams = Schema.decodeUnknown(UpdateTestCaseParamsSchema)
export const parseDeleteTestCaseParams = Schema.decodeUnknown(DeleteTestCaseParamsSchema)

// --- Result interfaces ---

export interface ListTestProjectsResult {
  readonly projects: ReadonlyArray<TestProjectSummary>
  readonly total: number
}

export interface ListTestSuitesResult {
  readonly suites: ReadonlyArray<TestSuiteSummary>
  readonly total: number
}

export interface GetTestSuiteResult extends TestSuiteSummary {
  readonly testCases: number
}

export interface CreateTestSuiteResult {
  readonly id: TestSuiteId
  readonly name: string
  readonly created: boolean
}

export interface UpdateTestSuiteResult {
  readonly id: TestSuiteId
  readonly updated: boolean
}

export interface DeleteTestSuiteResult {
  readonly id: TestSuiteId
  readonly deleted: boolean
}

export interface ListTestCasesResult {
  readonly testCases: ReadonlyArray<TestCaseSummary>
  readonly total: number
}

export interface GetTestCaseResult extends TestCaseSummary {
  readonly description?: string
  readonly suite?: string
}

export interface CreateTestCaseResult {
  readonly id: TestCaseId
  readonly name: string
  readonly created: boolean
}

export interface UpdateTestCaseResult {
  readonly id: TestCaseId
  readonly updated: boolean
}

export interface DeleteTestCaseResult {
  readonly id: TestCaseId
  readonly deleted: boolean
}
