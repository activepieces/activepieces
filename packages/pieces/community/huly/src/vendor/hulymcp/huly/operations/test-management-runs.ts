import type { Employee } from "@hcengineering/contact"
import type { DocumentUpdate, MarkupBlobRef, Ref } from "@hcengineering/core"
import { generateId, SortingOrder } from "@hcengineering/core"
import { Effect } from "effect"

import { TestResultId, TestRunId } from "../../domain/schemas/shared.js"
import type {
  CreateTestResultParams,
  CreateTestResultResult,
  CreateTestRunParams,
  CreateTestRunResult,
  DeleteTestResultParams,
  DeleteTestResultResult,
  DeleteTestRunParams,
  DeleteTestRunResult,
  GetTestResultDetail,
  GetTestResultParams,
  GetTestRunParams,
  GetTestRunResult,
  ListTestResultsParams,
  ListTestResultsResult,
  ListTestRunsParams,
  ListTestRunsResult,
  RunTestPlanParams,
  RunTestPlanResult,
  TestResultSummary,
  TestRunSummary,
  UpdateTestResultParams,
  UpdateTestResultResult,
  UpdateTestRunParams,
  UpdateTestRunResult
} from "../../domain/schemas/test-management-plans.js"
import { HulyClient, type HulyClientError } from "../client.js"
import type {
  PersonNotFoundError,
  TestPlanNotFoundError,
  TestProjectNotFoundError,
  TestResultNotFoundError,
  TestRunNotFoundError
} from "../errors.js"
import { TestCaseNotFoundError } from "../errors.js"
import { testManagement } from "../test-management-classes.js"
import type { TestCase, TestPlanItem, TestResult, TestRun } from "../test-management-types.js"
import { TestRunStatus } from "../test-management-types.js"
import { clampLimit, toRef } from "./shared.js"
import {
  fetchDescription,
  findTestCase,
  findTestPlan,
  findTestProject,
  findTestResult,
  findTestRun,
  resolveAssignee,
  stringToTestRunStatus,
  testRunStatusToString
} from "./test-management-shared.js"

type TestRunOpError = HulyClientError | TestProjectNotFoundError
type TestRunMutateError = TestRunOpError | TestRunNotFoundError
type TestResultMutateError = HulyClientError | TestProjectNotFoundError | TestResultNotFoundError
type CreateResultError = TestRunOpError | TestRunNotFoundError | TestCaseNotFoundError | PersonNotFoundError
type RunPlanError = HulyClientError | TestProjectNotFoundError | TestPlanNotFoundError | TestCaseNotFoundError

const BATCH_CONCURRENCY = 10

const toRunSummary = (r: TestRun): TestRunSummary => ({
  id: TestRunId.make(r._id),
  name: r.name,
  ...(r.dueDate !== undefined ? { dueDate: r.dueDate } : {})
})

const toResultSummary = (r: TestResult): TestResultSummary => ({
  id: TestResultId.make(r._id),
  name: r.name,
  testCase: r.testCase,
  ...(r.status !== undefined ? { status: testRunStatusToString(r.status) } : {}),
  ...(r.assignee !== undefined ? { assignee: r.assignee } : {})
})

export const listTestRuns = (
  params: ListTestRunsParams
): Effect.Effect<ListTestRunsResult, TestRunOpError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const limit = clampLimit(params.limit)
    const runs = yield* client.findAll<TestRun>(
      testManagement.class.TestRun,
      { space: project._id },
      { limit, sort: { modifiedOn: SortingOrder.Descending } }
    )
    return { runs: runs.map(toRunSummary), total: runs.total }
  })

export const getTestRun = (
  params: GetTestRunParams
): Effect.Effect<GetTestRunResult, TestRunMutateError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const run = yield* findTestRun(client, project, params.run)
    const results = yield* client.findAll<TestResult>(
      testManagement.class.TestResult,
      { attachedTo: run._id }
    )
    const descriptionStr = yield* fetchDescription(
      client,
      testManagement.class.TestRun,
      run._id,
      run.description
    )
    return {
      id: TestRunId.make(run._id),
      name: run.name,
      ...(descriptionStr !== undefined ? { description: descriptionStr } : {}),
      ...(run.dueDate !== undefined ? { dueDate: run.dueDate } : {}),
      results: results.map(toResultSummary)
    }
  })

export const createTestRun = (
  params: CreateTestRunParams
): Effect.Effect<CreateTestRunResult, TestRunOpError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const runId: Ref<TestRun> = generateId()
    const descRef: MarkupBlobRef | null = params.description !== undefined && params.description.trim() !== ""
      ? yield* client.uploadMarkup(
        testManagement.class.TestRun,
        runId,
        "description",
        params.description,
        "markdown"
      )
      : null
    yield* client.createDoc(testManagement.class.TestRun, project._id, {
      name: params.name,
      description: descRef,
      ...(params.dueDate !== undefined ? { dueDate: params.dueDate } : {})
    }, runId)
    return { id: TestRunId.make(runId), name: params.name, created: true }
  })

export const updateTestRun = (
  params: UpdateTestRunParams
): Effect.Effect<UpdateTestRunResult, TestRunMutateError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const run = yield* findTestRun(client, project, params.run)
    const ops: DocumentUpdate<TestRun> = {}
    if (params.name !== undefined) ops.name = params.name
    if (params.description !== undefined) {
      if (params.description === null) {
        ops.description = null
      } else {
        ops.description = yield* client.uploadMarkup(
          testManagement.class.TestRun,
          run._id,
          "description",
          params.description,
          "markdown"
        )
      }
    }
    if (params.dueDate !== undefined) {
      if (params.dueDate === null) ops.$unset = { dueDate: "" }
      else ops.dueDate = params.dueDate
    }
    if (Object.keys(ops).length === 0) return { id: TestRunId.make(run._id), updated: false }
    yield* client.updateDoc(testManagement.class.TestRun, project._id, run._id, ops)
    return { id: TestRunId.make(run._id), updated: true }
  })

export const deleteTestRun = (
  params: DeleteTestRunParams
): Effect.Effect<DeleteTestRunResult, TestRunMutateError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const run = yield* findTestRun(client, project, params.run)
    yield* client.removeDoc(testManagement.class.TestRun, project._id, run._id)
    return { id: TestRunId.make(run._id), deleted: true }
  })

export const listTestResults = (
  params: ListTestResultsParams
): Effect.Effect<ListTestResultsResult, TestRunMutateError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const run = yield* findTestRun(client, project, params.run)
    const limit = clampLimit(params.limit)
    const results = yield* client.findAll<TestResult>(
      testManagement.class.TestResult,
      { attachedTo: run._id },
      { limit, sort: { modifiedOn: SortingOrder.Descending } }
    )
    return { results: results.map(toResultSummary), total: results.total }
  })

export const getTestResult = (
  params: GetTestResultParams
): Effect.Effect<GetTestResultDetail, TestResultMutateError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const result = yield* findTestResult(client, project, params.result)
    const descriptionStr = yield* fetchDescription(
      client,
      testManagement.class.TestResult,
      result._id,
      result.description
    )
    return {
      id: TestResultId.make(result._id),
      name: result.name,
      testCase: result.testCase,
      ...(result.testSuite !== undefined ? { testSuite: result.testSuite } : {}),
      ...(result.status !== undefined ? { status: testRunStatusToString(result.status) } : {}),
      ...(result.assignee !== undefined ? { assignee: result.assignee } : {}),
      ...(descriptionStr !== undefined ? { description: descriptionStr } : {})
    }
  })

export const createTestResult = (
  params: CreateTestResultParams
): Effect.Effect<CreateTestResultResult, CreateResultError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const run = yield* findTestRun(client, project, params.run)
    const tc = yield* findTestCase(client, project, params.testCase)
    const name = params.name ?? tc.name
    const resultAttrs: Record<string, unknown> = {
      name,
      testCase: tc._id,
      status: params.status !== undefined
        ? (stringToTestRunStatus(params.status) ?? TestRunStatus.Untested)
        : TestRunStatus.Untested,
      description: null
    }
    if (params.assignee !== undefined) {
      resultAttrs.assignee = toRef<Employee>((yield* resolveAssignee(params.assignee))._id)
    }
    // AttachedData<TestResult> with exactOptionalPropertyTypes — cast at boundary
    const resultId = yield* client.addCollection(
      testManagement.class.TestResult,
      project._id,
      run._id,
      testManagement.class.TestRun,
      "results",
      // eslint-disable-next-line no-restricted-syntax -- AttachedData<TestResult> SDK boundary cast
      resultAttrs as Parameters<typeof client.addCollection<TestRun, TestResult>>[5]
    )
    return { id: TestResultId.make(resultId), name, created: true }
  })

export const updateTestResult = (
  params: UpdateTestResultParams
): Effect.Effect<UpdateTestResultResult, TestResultMutateError | PersonNotFoundError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const result = yield* findTestResult(client, project, params.result)
    const ops: DocumentUpdate<TestResult> = {}
    if (params.status !== undefined) ops.status = stringToTestRunStatus(params.status) ?? TestRunStatus.Untested
    if (params.assignee !== undefined) {
      if (params.assignee === null) ops.$unset = { ...ops.$unset, assignee: "" }
      else ops.assignee = toRef<Employee>((yield* resolveAssignee(params.assignee))._id)
    }
    if (params.description !== undefined) {
      if (params.description === null) ops.description = null
      else {
        ops.description = yield* client.uploadMarkup(
          testManagement.class.TestResult,
          result._id,
          "description",
          params.description,
          "markdown"
        )
      }
    }
    if (Object.keys(ops).length === 0) return { id: TestResultId.make(result._id), updated: false }
    yield* client.updateDoc(testManagement.class.TestResult, result.space, result._id, ops)
    return { id: TestResultId.make(result._id), updated: true }
  })

export const deleteTestResult = (
  params: DeleteTestResultParams
): Effect.Effect<DeleteTestResultResult, TestResultMutateError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const result = yield* findTestResult(client, project, params.result)
    yield* client.removeDoc(testManagement.class.TestResult, result.space, result._id)
    return { id: TestResultId.make(result._id), deleted: true }
  })

export const runTestPlan = (
  params: RunTestPlanParams
): Effect.Effect<RunTestPlanResult, RunPlanError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const plan = yield* findTestPlan(client, project, params.plan)
    const items = yield* client.findAll<TestPlanItem>(
      testManagement.class.TestPlanItem,
      { attachedTo: plan._id }
    )
    // Pre-validate all test cases before creating server-side state
    // to avoid orphaned runs on partial failure.
    const validated = yield* Effect.forEach(items, (item) =>
      Effect.gen(function*() {
        const tc = yield* client.findOne<TestCase>(
          testManagement.class.TestCase,
          { _id: item.testCase }
        )
        if (tc === undefined) {
          return yield* new TestCaseNotFoundError({ identifier: item.testCase })
        }
        return { item, tc }
      }), { concurrency: BATCH_CONCURRENCY })
    const runId: Ref<TestRun> = generateId()
    const runName = params.runName ?? `${plan.name} - Run`
    yield* client.createDoc(testManagement.class.TestRun, project._id, {
      name: runName,
      description: null,
      ...(params.dueDate !== undefined ? { dueDate: params.dueDate } : {})
    }, runId)
    const results = yield* Effect.forEach(validated, ({ item, tc }) =>
      Effect.gen(function*() {
        const attrs: Record<string, unknown> = {
          name: tc.name,
          testCase: item.testCase,
          status: TestRunStatus.Untested,
          description: null
        }
        if (item.testSuite !== undefined) attrs.testSuite = item.testSuite
        if (item.assignee !== undefined) attrs.assignee = item.assignee
        return yield* client.addCollection(
          testManagement.class.TestResult,
          project._id,
          runId,
          testManagement.class.TestRun,
          "results",
          // eslint-disable-next-line no-restricted-syntax -- AttachedData<TestResult> SDK boundary cast
          attrs as Parameters<typeof client.addCollection<TestRun, TestResult>>[5]
        )
      }), { concurrency: BATCH_CONCURRENCY })
    return { runId: TestRunId.make(runId), name: runName, resultsCreated: results.length }
  })
