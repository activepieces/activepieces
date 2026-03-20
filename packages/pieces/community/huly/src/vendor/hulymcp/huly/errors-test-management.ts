/**
 * Test management domain errors.
 *
 * @module
 */
import { Schema } from "effect"

export class TestProjectNotFoundError extends Schema.TaggedError<TestProjectNotFoundError>()(
  "TestProjectNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Test project '${this.identifier}' not found`
  }
}

export class TestSuiteNotFoundError extends Schema.TaggedError<TestSuiteNotFoundError>()(
  "TestSuiteNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Test suite '${this.identifier}' not found`
  }
}

export class TestCaseNotFoundError extends Schema.TaggedError<TestCaseNotFoundError>()(
  "TestCaseNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Test case '${this.identifier}' not found`
  }
}

export class TestPlanNotFoundError extends Schema.TaggedError<TestPlanNotFoundError>()(
  "TestPlanNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Test plan '${this.identifier}' not found`
  }
}

export class TestRunNotFoundError extends Schema.TaggedError<TestRunNotFoundError>()(
  "TestRunNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Test run '${this.identifier}' not found`
  }
}

export class TestResultNotFoundError extends Schema.TaggedError<TestResultNotFoundError>()(
  "TestResultNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Test result '${this.identifier}' not found`
  }
}

export class TestPlanItemNotFoundError extends Schema.TaggedError<TestPlanItemNotFoundError>()(
  "TestPlanItemNotFoundError",
  {
    identifier: Schema.String,
    plan: Schema.String
  }
) {
  override get message(): string {
    return `Test plan item '${this.identifier}' not found in plan '${this.plan}'`
  }
}
