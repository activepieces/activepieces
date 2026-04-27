/* eslint-disable no-restricted-syntax -- reverse enum maps: Object.entries loses numeric enum type, cast back is unavoidable */
import type { MarkupRef } from "@hcengineering/api-client"
import type { Person } from "@hcengineering/contact"
import type { Class, Doc, Ref } from "@hcengineering/core"
import { Effect } from "effect"

import { HulyClient, type HulyClientError, type HulyClientOperations } from "../client.js"
import {
  PersonNotFoundError,
  TestCaseNotFoundError,
  TestPlanNotFoundError,
  TestProjectNotFoundError,
  TestResultNotFoundError,
  TestRunNotFoundError,
  TestSuiteNotFoundError
} from "../errors.js"
import { testManagement } from "../test-management-classes.js"
import type {
  TestCase,
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TestPlan,
  TestProject,
  TestResult,
  TestRun,
  TestRunStatus,
  TestSuite
} from "../test-management-types.js"
import {
  TestCasePriority as CasePriority,
  TestCaseStatus as CaseStatus,
  TestCaseType as CaseType,
  TestRunStatus as RunStatus
} from "../test-management-types.js"
import { findPersonByEmailOrName, toRef } from "./shared.js"

import type {
  TestCasePriorityStr,
  TestCaseStatusStr,
  TestCaseTypeStr,
  TestRunStatusStr
} from "../../domain/schemas/test-management-core.js"

// --- Bidirectional enum maps ---

const caseTypeToString: Record<TestCaseType, TestCaseTypeStr> = {
  [CaseType.Functional]: "functional",
  [CaseType.Performance]: "performance",
  [CaseType.Regression]: "regression",
  [CaseType.Security]: "security",
  [CaseType.Smoke]: "smoke",
  [CaseType.Usability]: "usability"
}

const stringToCaseType: Record<string, TestCaseType> = Object.fromEntries(
  Object.entries(caseTypeToString).map(([k, v]) => [v, Number(k) as TestCaseType])
)

export const testCaseTypeToString = (t: TestCaseType): TestCaseTypeStr => caseTypeToString[t]
export const stringToTestCaseType = (s: string): TestCaseType | undefined => stringToCaseType[s.toLowerCase()]

const casePriorityToString: Record<TestCasePriority, TestCasePriorityStr> = {
  [CasePriority.Low]: "low",
  [CasePriority.Medium]: "medium",
  [CasePriority.High]: "high",
  [CasePriority.Urgent]: "urgent"
}

const stringToCasePriority: Record<string, TestCasePriority> = Object.fromEntries(
  Object.entries(casePriorityToString).map(([k, v]) => [v, Number(k) as TestCasePriority])
)

export const testCasePriorityToString = (p: TestCasePriority): TestCasePriorityStr => casePriorityToString[p]
export const stringToTestCasePriority = (s: string): TestCasePriority | undefined =>
  stringToCasePriority[s.toLowerCase()]

const caseStatusToString: Record<TestCaseStatus, TestCaseStatusStr> = {
  [CaseStatus.Draft]: "draft",
  [CaseStatus.ReadyForReview]: "ready-for-review",
  [CaseStatus.FixReviewComments]: "fix-review-comments",
  [CaseStatus.Approved]: "approved",
  [CaseStatus.Rejected]: "rejected"
}

const stringToCaseStatus: Record<string, TestCaseStatus> = Object.fromEntries(
  Object.entries(caseStatusToString).map(([k, v]) => [v, Number(k) as TestCaseStatus])
)

export const testCaseStatusToString = (s: TestCaseStatus): TestCaseStatusStr => caseStatusToString[s]
export const stringToTestCaseStatus = (s: string): TestCaseStatus | undefined => stringToCaseStatus[s.toLowerCase()]

const runStatusToString: Record<TestRunStatus, TestRunStatusStr> = {
  [RunStatus.Untested]: "untested",
  [RunStatus.Blocked]: "blocked",
  [RunStatus.Passed]: "passed",
  [RunStatus.Failed]: "failed"
}

const stringToRunStatus: Record<string, TestRunStatus> = Object.fromEntries(
  Object.entries(runStatusToString).map(([k, v]) => [v, Number(k) as TestRunStatus])
)

export const testRunStatusToString = (s: TestRunStatus): TestRunStatusStr => runStatusToString[s]
export const stringToTestRunStatus = (s: string): TestRunStatus | undefined => stringToRunStatus[s.toLowerCase()]

// --- Markup helpers ---

export const fetchDescription = (
  client: HulyClientOperations,
  _class: Ref<Class<Doc>>,
  docId: Ref<Doc>,
  description: MarkupRef | null
): Effect.Effect<string | undefined, HulyClientError> =>
  description !== null
    ? client.fetchMarkup(_class, docId, "description", description, "markdown")
    : Effect.succeed(undefined)

// --- Finder helpers ---

export const findTestProject = (
  client: HulyClientOperations,
  idOrName: string
): Effect.Effect<TestProject, TestProjectNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    let project = yield* client.findOne<TestProject>(
      testManagement.class.TestProject,
      { _id: toRef<TestProject>(idOrName) }
    )
    if (project === undefined) {
      project = yield* client.findOne<TestProject>(
        testManagement.class.TestProject,
        { name: idOrName }
      )
    }
    if (project === undefined) {
      return yield* new TestProjectNotFoundError({ identifier: idOrName })
    }
    return project
  })

export const findTestSuite = (
  client: HulyClientOperations,
  project: TestProject,
  idOrName: string
): Effect.Effect<TestSuite, TestSuiteNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    let suite = yield* client.findOne<TestSuite>(
      testManagement.class.TestSuite,
      { _id: toRef<TestSuite>(idOrName), space: project._id }
    )
    if (suite === undefined) {
      suite = yield* client.findOne<TestSuite>(
        testManagement.class.TestSuite,
        { name: idOrName, space: project._id }
      )
    }
    if (suite === undefined) {
      return yield* new TestSuiteNotFoundError({ identifier: idOrName })
    }
    return suite
  })

export const findTestCase = (
  client: HulyClientOperations,
  project: TestProject,
  idOrName: string
): Effect.Effect<TestCase, TestCaseNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    let tc = yield* client.findOne<TestCase>(
      testManagement.class.TestCase,
      { _id: toRef<TestCase>(idOrName), space: project._id }
    )
    if (tc === undefined) {
      tc = yield* client.findOne<TestCase>(
        testManagement.class.TestCase,
        { name: idOrName, space: project._id }
      )
    }
    if (tc === undefined) {
      return yield* new TestCaseNotFoundError({ identifier: idOrName })
    }
    return tc
  })

export const findTestPlan = (
  client: HulyClientOperations,
  project: TestProject,
  idOrName: string
): Effect.Effect<TestPlan, TestPlanNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    let plan = yield* client.findOne<TestPlan>(
      testManagement.class.TestPlan,
      { _id: toRef<TestPlan>(idOrName), space: project._id }
    )
    if (plan === undefined) {
      plan = yield* client.findOne<TestPlan>(
        testManagement.class.TestPlan,
        { name: idOrName, space: project._id }
      )
    }
    if (plan === undefined) {
      return yield* new TestPlanNotFoundError({ identifier: idOrName })
    }
    return plan
  })

export const findTestRun = (
  client: HulyClientOperations,
  project: TestProject,
  idOrName: string
): Effect.Effect<TestRun, TestRunNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    let run = yield* client.findOne<TestRun>(
      testManagement.class.TestRun,
      { _id: toRef<TestRun>(idOrName), space: project._id }
    )
    if (run === undefined) {
      run = yield* client.findOne<TestRun>(
        testManagement.class.TestRun,
        { name: idOrName, space: project._id }
      )
    }
    if (run === undefined) {
      return yield* new TestRunNotFoundError({ identifier: idOrName })
    }
    return run
  })

export const findTestResult = (
  client: HulyClientOperations,
  project: TestProject,
  idOrName: string
): Effect.Effect<TestResult, TestResultNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    let result = yield* client.findOne<TestResult>(
      testManagement.class.TestResult,
      { _id: toRef<TestResult>(idOrName), space: project._id }
    )
    if (result === undefined) {
      result = yield* client.findOne<TestResult>(
        testManagement.class.TestResult,
        { name: idOrName, space: project._id }
      )
    }
    if (result === undefined) {
      return yield* new TestResultNotFoundError({ identifier: idOrName })
    }
    return result
  })

export const resolveAssignee = (
  emailOrName: string
): Effect.Effect<Person, PersonNotFoundError | HulyClientError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient
    const person = yield* findPersonByEmailOrName(client, emailOrName)
    if (person === undefined) {
      return yield* new PersonNotFoundError({ identifier: emailOrName })
    }
    return person
  })
