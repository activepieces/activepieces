import { JSONSchema, Schema } from "effect"

import type { TestPlanId, TestPlanItemId, TestResultId, TestRunId } from "./shared.js"
import {
  LimitParam,
  NonEmptyString,
  TestCaseIdentifier,
  TestPlanIdentifier,
  TestPlanItemId as TestPlanItemIdSchema,
  TestProjectIdentifier,
  TestResultIdentifier,
  TestRunIdentifier,
  Timestamp
} from "./shared.js"

import { TestRunStatusSchema, type TestRunStatusStr } from "./test-management-core.js"

const projectField = TestProjectIdentifier.annotations({ description: "Test project ID or name" })
const limitField = LimitParam.annotations({ description: "Max items to return (default: 50)" })
const planField = TestPlanIdentifier.annotations({ description: "Test plan ID or name" })
const runField = TestRunIdentifier.annotations({ description: "Test run ID or name" })
const resultField = TestResultIdentifier.annotations({ description: "Test result ID or name" })
const nameField = NonEmptyString.annotations({ description: "Name" })
const descField = Schema.String.annotations({ description: "Description" })
const descNullField = Schema.NullOr(Schema.String).annotations({ description: "Description, or null to clear" })
const assigneeField = NonEmptyString.annotations({ description: "Assignee email or name" })

export interface TestPlanSummary {
  readonly id: TestPlanId
  readonly name: string
}
export interface TestPlanItemSummary {
  readonly id: TestPlanItemId
  readonly testCase: string
  readonly testSuite?: string
  readonly assignee?: string
}
export interface TestRunSummary {
  readonly id: TestRunId
  readonly name: string
  readonly dueDate?: number
}
export interface TestResultSummary {
  readonly id: TestResultId
  readonly name: string
  readonly testCase: string
  readonly status?: TestRunStatusStr
  readonly assignee?: string
}

export const ListTestPlansParamsSchema = Schema.Struct({
  project: projectField,
  limit: Schema.optional(limitField)
}).annotations({ title: "ListTestPlansParams", description: "List test plans in a project" })
export type ListTestPlansParams = Schema.Schema.Type<typeof ListTestPlansParamsSchema>
export interface ListTestPlansResult {
  readonly plans: ReadonlyArray<TestPlanSummary>
  readonly total: number
}

export const GetTestPlanParamsSchema = Schema.Struct({
  project: projectField,
  plan: planField
}).annotations({ title: "GetTestPlanParams", description: "Get test plan details including items" })
export type GetTestPlanParams = Schema.Schema.Type<typeof GetTestPlanParamsSchema>
export interface GetTestPlanResult {
  readonly id: TestPlanId
  readonly name: string
  readonly description?: string
  readonly items: ReadonlyArray<TestPlanItemSummary>
}

export const CreateTestPlanParamsSchema = Schema.Struct({
  project: projectField,
  name: nameField,
  description: Schema.optional(descField)
}).annotations({ title: "CreateTestPlanParams", description: "Create a test plan" })
export type CreateTestPlanParams = Schema.Schema.Type<typeof CreateTestPlanParamsSchema>
export interface CreateTestPlanResult {
  readonly id: TestPlanId
  readonly name: string
  readonly created: boolean
}

export const UpdateTestPlanParamsSchema = Schema.Struct({
  project: projectField,
  plan: planField,
  name: Schema.optional(nameField),
  description: Schema.optional(descNullField)
}).annotations({ title: "UpdateTestPlanParams", description: "Update a test plan" })
export type UpdateTestPlanParams = Schema.Schema.Type<typeof UpdateTestPlanParamsSchema>
export interface UpdateTestPlanResult {
  readonly id: TestPlanId
  readonly updated: boolean
}

export const DeleteTestPlanParamsSchema = Schema.Struct({
  project: projectField,
  plan: planField
}).annotations({ title: "DeleteTestPlanParams", description: "Delete a test plan" })
export type DeleteTestPlanParams = Schema.Schema.Type<typeof DeleteTestPlanParamsSchema>
export interface DeleteTestPlanResult {
  readonly id: TestPlanId
  readonly deleted: boolean
}

export const AddTestPlanItemParamsSchema = Schema.Struct({
  project: projectField,
  plan: planField,
  testCase: TestCaseIdentifier.annotations({ description: "Test case ID or name to add" }),
  assignee: Schema.optional(assigneeField)
}).annotations({ title: "AddTestPlanItemParams", description: "Add a test case to a test plan" })
export type AddTestPlanItemParams = Schema.Schema.Type<typeof AddTestPlanItemParamsSchema>
export interface AddTestPlanItemResult {
  readonly id: TestPlanItemId
  readonly added: boolean
}

export const RemoveTestPlanItemParamsSchema = Schema.Struct({
  project: projectField,
  plan: planField,
  item: TestPlanItemIdSchema.annotations({ description: "Test plan item ID to remove" })
}).annotations({ title: "RemoveTestPlanItemParams", description: "Remove a test case from a test plan" })
export type RemoveTestPlanItemParams = Schema.Schema.Type<typeof RemoveTestPlanItemParamsSchema>
export interface RemoveTestPlanItemResult {
  readonly id: TestPlanItemId
  readonly removed: boolean
}

export const ListTestRunsParamsSchema = Schema.Struct({
  project: projectField,
  limit: Schema.optional(limitField)
}).annotations({ title: "ListTestRunsParams", description: "List test runs in a project" })
export type ListTestRunsParams = Schema.Schema.Type<typeof ListTestRunsParamsSchema>
export interface ListTestRunsResult {
  readonly runs: ReadonlyArray<TestRunSummary>
  readonly total: number
}

export const GetTestRunParamsSchema = Schema.Struct({
  project: projectField,
  run: runField
}).annotations({ title: "GetTestRunParams", description: "Get test run details including results" })
export type GetTestRunParams = Schema.Schema.Type<typeof GetTestRunParamsSchema>
export interface GetTestRunResult {
  readonly id: TestRunId
  readonly name: string
  readonly description?: string
  readonly dueDate?: number
  readonly results: ReadonlyArray<TestResultSummary>
}

const dueDateField = Timestamp.annotations({ description: "Due date as Unix timestamp in milliseconds" })

export const CreateTestRunParamsSchema = Schema.Struct({
  project: projectField,
  name: nameField,
  description: Schema.optional(descField),
  dueDate: Schema.optional(dueDateField)
}).annotations({ title: "CreateTestRunParams", description: "Create a test run" })
export type CreateTestRunParams = Schema.Schema.Type<typeof CreateTestRunParamsSchema>
export interface CreateTestRunResult {
  readonly id: TestRunId
  readonly name: string
  readonly created: boolean
}

export const UpdateTestRunParamsSchema = Schema.Struct({
  project: projectField,
  run: runField,
  name: Schema.optional(nameField),
  description: Schema.optional(descNullField),
  dueDate: Schema.optional(
    Schema.NullOr(Timestamp).annotations({
      description: "Due date (ms timestamp), or null to clear"
    })
  )
}).annotations({ title: "UpdateTestRunParams", description: "Update a test run" })
export type UpdateTestRunParams = Schema.Schema.Type<typeof UpdateTestRunParamsSchema>
export interface UpdateTestRunResult {
  readonly id: TestRunId
  readonly updated: boolean
}

export const DeleteTestRunParamsSchema = Schema.Struct({
  project: projectField,
  run: runField
}).annotations({ title: "DeleteTestRunParams", description: "Delete a test run" })
export type DeleteTestRunParams = Schema.Schema.Type<typeof DeleteTestRunParamsSchema>
export interface DeleteTestRunResult {
  readonly id: TestRunId
  readonly deleted: boolean
}

export const ListTestResultsParamsSchema = Schema.Struct({
  project: projectField,
  run: runField,
  limit: Schema.optional(limitField)
}).annotations({ title: "ListTestResultsParams", description: "List test results in a run" })
export type ListTestResultsParams = Schema.Schema.Type<typeof ListTestResultsParamsSchema>
export interface ListTestResultsResult {
  readonly results: ReadonlyArray<TestResultSummary>
  readonly total: number
}

export const GetTestResultParamsSchema = Schema.Struct({
  project: projectField,
  result: resultField
}).annotations({ title: "GetTestResultParams", description: "Get test result details" })
export type GetTestResultParams = Schema.Schema.Type<typeof GetTestResultParamsSchema>
export interface GetTestResultDetail {
  readonly id: TestResultId
  readonly name: string
  readonly testCase: string
  readonly testSuite?: string
  readonly status?: TestRunStatusStr
  readonly assignee?: string
  readonly description?: string
}

const statusField = TestRunStatusSchema.annotations({ description: "Status: untested, blocked, passed, failed" })

export const CreateTestResultParamsSchema = Schema.Struct({
  project: projectField,
  run: runField,
  testCase: TestCaseIdentifier.annotations({ description: "Test case ID or name" }),
  name: Schema.optional(NonEmptyString.annotations({ description: "Result name (defaults to test case name)" })),
  status: Schema.optional(statusField),
  assignee: Schema.optional(assigneeField)
}).annotations({ title: "CreateTestResultParams", description: "Create a test result in a run" })
export type CreateTestResultParams = Schema.Schema.Type<typeof CreateTestResultParamsSchema>
export interface CreateTestResultResult {
  readonly id: TestResultId
  readonly name: string
  readonly created: boolean
}

export const UpdateTestResultParamsSchema = Schema.Struct({
  project: projectField,
  result: resultField,
  status: Schema.optional(statusField),
  assignee: Schema.optional(
    Schema.NullOr(NonEmptyString).annotations({ description: "Assignee email or name, or null to unassign" })
  ),
  description: Schema.optional(descNullField)
}).annotations({ title: "UpdateTestResultParams", description: "Update a test result" })
export type UpdateTestResultParams = Schema.Schema.Type<typeof UpdateTestResultParamsSchema>
export interface UpdateTestResultResult {
  readonly id: TestResultId
  readonly updated: boolean
}

export const DeleteTestResultParamsSchema = Schema.Struct({
  project: projectField,
  result: resultField
}).annotations({ title: "DeleteTestResultParams", description: "Delete a test result" })
export type DeleteTestResultParams = Schema.Schema.Type<typeof DeleteTestResultParamsSchema>
export interface DeleteTestResultResult {
  readonly id: TestResultId
  readonly deleted: boolean
}

export const RunTestPlanParamsSchema = Schema.Struct({
  project: projectField,
  plan: planField,
  runName: Schema.optional(NonEmptyString.annotations({ description: "Name for the created test run" })),
  dueDate: Schema.optional(dueDateField)
}).annotations({ title: "RunTestPlanParams", description: "Execute a test plan by creating a run with results" })
export type RunTestPlanParams = Schema.Schema.Type<typeof RunTestPlanParamsSchema>
export interface RunTestPlanResult {
  readonly runId: TestRunId
  readonly name: string
  readonly resultsCreated: number
}

export const listTestPlansParamsJsonSchema = JSONSchema.make(ListTestPlansParamsSchema)
export const getTestPlanParamsJsonSchema = JSONSchema.make(GetTestPlanParamsSchema)
export const createTestPlanParamsJsonSchema = JSONSchema.make(CreateTestPlanParamsSchema)
export const updateTestPlanParamsJsonSchema = JSONSchema.make(UpdateTestPlanParamsSchema)
export const deleteTestPlanParamsJsonSchema = JSONSchema.make(DeleteTestPlanParamsSchema)
export const addTestPlanItemParamsJsonSchema = JSONSchema.make(AddTestPlanItemParamsSchema)
export const removeTestPlanItemParamsJsonSchema = JSONSchema.make(RemoveTestPlanItemParamsSchema)
export const listTestRunsParamsJsonSchema = JSONSchema.make(ListTestRunsParamsSchema)
export const getTestRunParamsJsonSchema = JSONSchema.make(GetTestRunParamsSchema)
export const createTestRunParamsJsonSchema = JSONSchema.make(CreateTestRunParamsSchema)
export const updateTestRunParamsJsonSchema = JSONSchema.make(UpdateTestRunParamsSchema)
export const deleteTestRunParamsJsonSchema = JSONSchema.make(DeleteTestRunParamsSchema)
export const listTestResultsParamsJsonSchema = JSONSchema.make(ListTestResultsParamsSchema)
export const getTestResultParamsJsonSchema = JSONSchema.make(GetTestResultParamsSchema)
export const createTestResultParamsJsonSchema = JSONSchema.make(CreateTestResultParamsSchema)
export const updateTestResultParamsJsonSchema = JSONSchema.make(UpdateTestResultParamsSchema)
export const deleteTestResultParamsJsonSchema = JSONSchema.make(DeleteTestResultParamsSchema)
export const runTestPlanParamsJsonSchema = JSONSchema.make(RunTestPlanParamsSchema)

export const parseListTestPlansParams = Schema.decodeUnknown(ListTestPlansParamsSchema)
export const parseGetTestPlanParams = Schema.decodeUnknown(GetTestPlanParamsSchema)
export const parseCreateTestPlanParams = Schema.decodeUnknown(CreateTestPlanParamsSchema)
export const parseUpdateTestPlanParams = Schema.decodeUnknown(UpdateTestPlanParamsSchema)
export const parseDeleteTestPlanParams = Schema.decodeUnknown(DeleteTestPlanParamsSchema)
export const parseAddTestPlanItemParams = Schema.decodeUnknown(AddTestPlanItemParamsSchema)
export const parseRemoveTestPlanItemParams = Schema.decodeUnknown(RemoveTestPlanItemParamsSchema)
export const parseListTestRunsParams = Schema.decodeUnknown(ListTestRunsParamsSchema)
export const parseGetTestRunParams = Schema.decodeUnknown(GetTestRunParamsSchema)
export const parseCreateTestRunParams = Schema.decodeUnknown(CreateTestRunParamsSchema)
export const parseUpdateTestRunParams = Schema.decodeUnknown(UpdateTestRunParamsSchema)
export const parseDeleteTestRunParams = Schema.decodeUnknown(DeleteTestRunParamsSchema)
export const parseListTestResultsParams = Schema.decodeUnknown(ListTestResultsParamsSchema)
export const parseGetTestResultParams = Schema.decodeUnknown(GetTestResultParamsSchema)
export const parseCreateTestResultParams = Schema.decodeUnknown(CreateTestResultParamsSchema)
export const parseUpdateTestResultParams = Schema.decodeUnknown(UpdateTestResultParamsSchema)
export const parseDeleteTestResultParams = Schema.decodeUnknown(DeleteTestResultParamsSchema)
export const parseRunTestPlanParams = Schema.decodeUnknown(RunTestPlanParamsSchema)
