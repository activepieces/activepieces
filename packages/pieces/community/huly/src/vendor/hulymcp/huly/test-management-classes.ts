// Hardcoded class IDs for Huly test-management entities.
// @hcengineering/test-management is not published to npm, so we cannot
// import a typed plugin object. These IDs follow the standard Huly
// pattern: 'pluginId:class:ClassName'.
// Source: plugins/test-management/src/plugin.ts in hcengineering/platform

import type { Class, Ref } from "@hcengineering/core"

import type {
  TestCase,
  TestPlan,
  TestPlanItem,
  TestProject,
  TestResult,
  TestRun,
  TestSuite
} from "./test-management-types.js"

// One `as Ref<Class<T>>` per class — unavoidable since there is no
// runtime plugin registry to resolve these. Downstream code is fully
// type-safe via the generics on findAll/createDoc/updateDoc.
/* eslint-disable no-restricted-syntax -- string literal → Ref<Class<T>> SDK boundary, no constructor */
export const testManagement = {
  class: {
    TestProject: "testManagement:class:TestProject" as Ref<Class<TestProject>>,
    TestSuite: "testManagement:class:TestSuite" as Ref<Class<TestSuite>>,
    TestCase: "testManagement:class:TestCase" as Ref<Class<TestCase>>,
    TestPlan: "testManagement:class:TestPlan" as Ref<Class<TestPlan>>,
    TestPlanItem: "testManagement:class:TestPlanItem" as Ref<Class<TestPlanItem>>,
    TestRun: "testManagement:class:TestRun" as Ref<Class<TestRun>>,
    TestResult: "testManagement:class:TestResult" as Ref<Class<TestResult>>
  }
} as const
/* eslint-enable no-restricted-syntax */
