import type { Employee } from "@hcengineering/contact"
import type {
  AttachedData,
  Class,
  Data,
  Doc,
  DocumentQuery,
  DocumentUpdate,
  MarkupBlobRef,
  Ref
} from "@hcengineering/core"
import { generateId, SortingOrder } from "@hcengineering/core"
import { Effect } from "effect"

import { TestCaseId, TestProjectId, TestSuiteId } from "../../domain/schemas/shared.js"
import type {
  CreateTestCaseParams,
  CreateTestCaseResult,
  CreateTestSuiteParams,
  CreateTestSuiteResult,
  DeleteTestCaseParams,
  DeleteTestCaseResult,
  DeleteTestSuiteParams,
  DeleteTestSuiteResult,
  GetTestCaseParams,
  GetTestCaseResult,
  GetTestSuiteParams,
  GetTestSuiteResult,
  ListTestCasesParams,
  ListTestCasesResult,
  ListTestProjectsParams,
  ListTestProjectsResult,
  ListTestSuitesParams,
  ListTestSuitesResult,
  TestCaseSummary,
  TestProjectSummary,
  TestSuiteSummary,
  UpdateTestCaseParams,
  UpdateTestCaseResult,
  UpdateTestSuiteParams,
  UpdateTestSuiteResult
} from "../../domain/schemas/test-management-core.js"
import { HulyClient, type HulyClientError } from "../client.js"
import type {
  PersonNotFoundError,
  TestCaseNotFoundError,
  TestProjectNotFoundError,
  TestSuiteNotFoundError
} from "../errors.js"
import { testManagement } from "../test-management-classes.js"
import {
  type TestCase,
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  type TestProject,
  type TestSuite
} from "../test-management-types.js"
import { clampLimit, toRef } from "./shared.js"
import {
  fetchDescription,
  findTestCase,
  findTestProject,
  findTestSuite,
  resolveAssignee,
  stringToTestCasePriority,
  stringToTestCaseStatus,
  stringToTestCaseType,
  testCasePriorityToString,
  testCaseStatusToString,
  testCaseTypeToString
} from "./test-management-shared.js"

type ListTestProjectsError = HulyClientError
type ListTestSuitesError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError
type GetTestSuiteError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError
type CreateTestSuiteError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError
type UpdateTestSuiteError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError
type DeleteTestSuiteError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError
type ListTestCasesError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError | PersonNotFoundError
type GetTestCaseError = HulyClientError | TestProjectNotFoundError | TestCaseNotFoundError
type CreateTestCaseError = HulyClientError | TestProjectNotFoundError | TestSuiteNotFoundError | PersonNotFoundError
type UpdateTestCaseError = HulyClientError | TestProjectNotFoundError | TestCaseNotFoundError | PersonNotFoundError
type DeleteTestCaseError = HulyClientError | TestProjectNotFoundError | TestCaseNotFoundError

const toProjectSummary = (p: TestProject): TestProjectSummary => {
  const result: TestProjectSummary = {
    id: TestProjectId.make(p._id),
    name: p.name,
    archived: p.archived
  }
  if (p.description) {
    return { ...result, description: p.description }
  }
  return result
}

const toSuiteSummary = (s: TestSuite): TestSuiteSummary => ({
  id: TestSuiteId.make(s._id),
  name: s.name,
  ...(s.description !== undefined ? { description: s.description } : {}),
  ...(s.parent ? { parent: s.parent } : {})
})

const toCaseSummary = (tc: TestCase): TestCaseSummary => {
  const result: TestCaseSummary = {
    id: TestCaseId.make(tc._id),
    name: tc.name,
    type: testCaseTypeToString(tc.type),
    priority: testCasePriorityToString(tc.priority),
    status: testCaseStatusToString(tc.status)
  }
  if (tc.assignee) {
    return { ...result, assignee: tc.assignee }
  }
  return result
}

// --- List Test Projects ---

export const listTestProjects = (
  params: ListTestProjectsParams
): Effect.Effect<ListTestProjectsResult, ListTestProjectsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const limit = clampLimit(params.limit)

    const projects = yield* client.findAll<TestProject>(
      testManagement.class.TestProject,
      {},
      {
        limit,
        sort: { name: SortingOrder.Ascending }
      }
    )

    return {
      projects: projects.map(toProjectSummary),
      total: projects.total
    }
  })

// --- List Test Suites ---

export const listTestSuites = (
  params: ListTestSuitesParams
): Effect.Effect<ListTestSuitesResult, ListTestSuitesError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const limit = clampLimit(params.limit)

    const query: DocumentQuery<TestSuite> = { space: project._id }

    if (params.parent !== undefined) {
      const parentSuite = yield* findTestSuite(client, project, params.parent)
      query.parent = parentSuite._id
    }

    const suites = yield* client.findAll<TestSuite>(
      testManagement.class.TestSuite,
      query,
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    return {
      suites: suites.map(toSuiteSummary),
      total: suites.total
    }
  })

// --- Get Test Suite ---

export const getTestSuite = (
  params: GetTestSuiteParams
): Effect.Effect<GetTestSuiteResult, GetTestSuiteError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const suite = yield* findTestSuite(client, project, params.suite)

    const cases = yield* client.findAll<TestCase>(
      testManagement.class.TestCase,
      { space: project._id, attachedTo: suite._id },
      { limit: 1 }
    )

    return {
      ...toSuiteSummary(suite),
      testCases: cases.total
    }
  })

// --- Create Test Suite ---

export const createTestSuite = (
  params: CreateTestSuiteParams
): Effect.Effect<CreateTestSuiteResult, CreateTestSuiteError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)

    // Resolve parent first — needed for both idempotency check and creation.
    // Default parent is the project class ref (Huly convention for root suites).
    // toRef bridges Ref<Class<TestProject>> -> Ref<TestSuite> at the SDK boundary.
    const parentRef: Ref<TestSuite> = params.parent !== undefined
      ? (yield* findTestSuite(client, project, params.parent))._id
      : toRef<TestSuite>(testManagement.class.TestProject)

    const existing = yield* client.findOne<TestSuite>(
      testManagement.class.TestSuite,
      { name: params.name, space: project._id, parent: parentRef }
    )

    if (existing !== undefined) {
      return { id: TestSuiteId.make(existing._id), name: existing.name, created: false }
    }

    const suiteId: Ref<TestSuite> = generateId()
    const suiteData: Record<string, unknown> = {
      name: params.name,
      description: params.description ?? "",
      parent: parentRef
    }

    yield* client.createDoc(
      testManagement.class.TestSuite,
      project._id,
      // eslint-disable-next-line no-restricted-syntax -- Data<TestSuite> SDK boundary, no typed constructor
      suiteData as Data<TestSuite>,
      suiteId
    )

    return { id: TestSuiteId.make(suiteId), name: params.name, created: true }
  })

// --- Update Test Suite ---

export const updateTestSuite = (
  params: UpdateTestSuiteParams
): Effect.Effect<UpdateTestSuiteResult, UpdateTestSuiteError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const suite = yield* findTestSuite(client, project, params.suite)

    const updateOps: DocumentUpdate<TestSuite> = {}

    if (params.name !== undefined) {
      updateOps.name = params.name
    }
    if (params.description !== undefined) {
      if (params.description === null) {
        updateOps.$unset = { ...updateOps.$unset, description: "" }
      } else {
        updateOps.description = params.description
      }
    }

    if (Object.keys(updateOps).length === 0) {
      return { id: TestSuiteId.make(suite._id), updated: false }
    }

    yield* client.updateDoc(
      testManagement.class.TestSuite,
      project._id,
      suite._id,
      updateOps
    )

    return { id: TestSuiteId.make(suite._id), updated: true }
  })

// --- Delete Test Suite ---

export const deleteTestSuite = (
  params: DeleteTestSuiteParams
): Effect.Effect<DeleteTestSuiteResult, DeleteTestSuiteError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const suite = yield* findTestSuite(client, project, params.suite)

    yield* client.removeDoc(
      testManagement.class.TestSuite,
      project._id,
      suite._id
    )

    return { id: TestSuiteId.make(suite._id), deleted: true }
  })

// --- List Test Cases ---

export const listTestCases = (
  params: ListTestCasesParams
): Effect.Effect<ListTestCasesResult, ListTestCasesError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const limit = clampLimit(params.limit)

    const query: DocumentQuery<TestCase> = { space: project._id }

    if (params.suite !== undefined) {
      const suite = yield* findTestSuite(client, project, params.suite)
      query.attachedTo = suite._id
    }

    if (params.assignee !== undefined) {
      const person = yield* resolveAssignee(params.assignee)
      query.assignee = toRef<Employee>(person._id)
    }

    const cases = yield* client.findAll<TestCase>(
      testManagement.class.TestCase,
      query,
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    return {
      testCases: cases.map(toCaseSummary),
      total: cases.total
    }
  })

// --- Get Test Case ---

export const getTestCase = (
  params: GetTestCaseParams
): Effect.Effect<GetTestCaseResult, GetTestCaseError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const tc = yield* findTestCase(client, project, params.testCase)

    const descriptionStr = yield* fetchDescription(
      client,
      testManagement.class.TestCase,
      tc._id,
      tc.description
    )

    return {
      ...toCaseSummary(tc),
      ...(descriptionStr !== undefined ? { description: descriptionStr } : {}),
      ...(tc.attachedTo ? { suite: tc.attachedTo } : {})
    }
  })

// --- Create Test Case ---

export const createTestCase = (
  params: CreateTestCaseParams
): Effect.Effect<CreateTestCaseResult, CreateTestCaseError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const suite = yield* findTestSuite(client, project, params.suite)

    const caseId: Ref<TestCase> = generateId()

    const assigneeRef: Ref<Employee> | null = params.assignee !== undefined
      ? toRef<Employee>((yield* resolveAssignee(params.assignee))._id)
      : null

    const typeEnum = params.type !== undefined
      ? stringToTestCaseType(params.type) ?? TestCaseType.Functional
      : TestCaseType.Functional
    const priorityEnum = params.priority !== undefined
      ? stringToTestCasePriority(params.priority) ?? TestCasePriority.Medium
      : TestCasePriority.Medium
    const statusEnum = params.status !== undefined
      ? stringToTestCaseStatus(params.status) ?? TestCaseStatus.Draft
      : TestCaseStatus.Draft

    const descRef: MarkupBlobRef | null = params.description !== undefined && params.description.trim() !== ""
      ? yield* client.uploadMarkup(
        testManagement.class.TestCase,
        caseId,
        "description",
        params.description,
        "markdown"
      )
      : null

    // TestCase is an AttachedDoc; no typed constructor for AttachedData<TestCase>.
    // Build as Record and cast once — unavoidable at the SDK boundary.
    const attrs: Record<string, unknown> = {
      name: params.name,
      description: descRef,
      type: typeEnum,
      priority: priorityEnum,
      status: statusEnum,
      assignee: assigneeRef
    }

    yield* client.addCollection(
      testManagement.class.TestCase,
      project._id,
      toRef<Doc>(suite._id),
      toRef<Class<Doc>>(testManagement.class.TestSuite),
      "testCases",
      // eslint-disable-next-line no-restricted-syntax -- AttachedData<TestCase> SDK boundary, no typed constructor
      attrs as AttachedData<TestCase>,
      caseId
    )

    return { id: TestCaseId.make(caseId), name: params.name, created: true }
  })

// --- Update Test Case ---

export const updateTestCase = (
  params: UpdateTestCaseParams
): Effect.Effect<UpdateTestCaseResult, UpdateTestCaseError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const tc = yield* findTestCase(client, project, params.testCase)

    const ops: Record<string, unknown> = {}

    if (params.name !== undefined) {
      ops.name = params.name
    }
    if (params.description !== undefined) {
      if (params.description === null) {
        ops.description = null
      } else {
        ops.description = yield* client.uploadMarkup(
          testManagement.class.TestCase,
          tc._id,
          "description",
          params.description,
          "markdown"
        )
      }
    }
    if (params.type !== undefined) {
      const typeEnum = stringToTestCaseType(params.type)
      if (typeEnum !== undefined) {
        ops.type = typeEnum
      }
    }
    if (params.priority !== undefined) {
      const priorityEnum = stringToTestCasePriority(params.priority)
      if (priorityEnum !== undefined) {
        ops.priority = priorityEnum
      }
    }
    if (params.status !== undefined) {
      const statusEnum = stringToTestCaseStatus(params.status)
      if (statusEnum !== undefined) {
        ops.status = statusEnum
      }
    }
    if (params.assignee !== undefined) {
      if (params.assignee === null) {
        ops.assignee = null
      } else {
        const person = yield* resolveAssignee(params.assignee)
        ops.assignee = toRef<Employee>(person._id)
      }
    }

    if (Object.keys(ops).length === 0) {
      return { id: TestCaseId.make(tc._id), updated: false }
    }

    yield* client.updateDoc(
      testManagement.class.TestCase,
      project._id,
      tc._id,
      // eslint-disable-next-line no-restricted-syntax -- DocumentUpdate<TestCase> SDK boundary, no typed constructor
      ops as DocumentUpdate<TestCase>
    )

    return { id: TestCaseId.make(tc._id), updated: true }
  })

// --- Delete Test Case ---

export const deleteTestCase = (
  params: DeleteTestCaseParams
): Effect.Effect<DeleteTestCaseResult, DeleteTestCaseError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const project = yield* findTestProject(client, params.project)
    const tc = yield* findTestCase(client, project, params.testCase)

    yield* client.removeDoc(
      testManagement.class.TestCase,
      project._id,
      tc._id
    )

    return { id: TestCaseId.make(tc._id), deleted: true }
  })
