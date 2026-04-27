// Local interfaces for Huly test-management entities.
// @hcengineering/test-management is not published to npm, so we declare
// the shapes ourselves extending @hcengineering/core base types.
// Fields sourced from: plugins/test-management/src/types.ts in hcengineering/platform

import type { MarkupRef } from "@hcengineering/api-client"
import type { Employee } from "@hcengineering/contact"
import type { AttachedDoc, Doc, Ref, Space, Timestamp } from "@hcengineering/core"

// --- Enums ---

export enum TestCaseType {
  Functional = 0,
  Performance = 1,
  Regression = 2,
  Security = 3,
  Smoke = 4,
  Usability = 5
}

export enum TestCasePriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3
}

export enum TestCaseStatus {
  Draft = 0,
  ReadyForReview = 1,
  FixReviewComments = 2,
  Approved = 3,
  Rejected = 4
}

export enum TestRunStatus {
  Untested = 0,
  Blocked = 1,
  Passed = 2,
  Failed = 3
}

// --- Entity interfaces ---

export interface TestProject extends Space {
  fullDescription?: MarkupRef
}

export interface TestSuite extends Doc {
  space: Ref<TestProject>
  name: string
  description?: string
  parent: Ref<TestSuite>
}

export interface TestCase extends AttachedDoc {
  space: Ref<TestProject>
  name: string
  description: MarkupRef | null
  type: TestCaseType
  priority: TestCasePriority
  status: TestCaseStatus
  assignee: Ref<Employee> | null
}

export interface TestRun extends Doc {
  space: Ref<TestProject>
  name: string
  description: MarkupRef | null
  dueDate?: Timestamp
}

export interface TestResult extends AttachedDoc {
  space: Ref<TestProject>
  name: string
  testCase: Ref<TestCase>
  testSuite?: Ref<TestSuite>
  status?: TestRunStatus
  description: MarkupRef | null
  assignee?: Ref<Employee>
}

export interface TestPlan extends Doc {
  space: Ref<TestProject>
  name: string
  description: MarkupRef | null
}

export interface TestPlanItem extends AttachedDoc {
  space: Ref<TestProject>
  testCase: Ref<TestCase>
  testSuite?: Ref<TestSuite>
  assignee?: Ref<Employee>
}
