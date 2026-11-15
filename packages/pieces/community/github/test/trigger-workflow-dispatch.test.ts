/// <reference types="vitest/globals" />

import { readFileSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';
import { parseWorkflowDispatchTrigger } from '../src/lib/actions/trigger-workflow-dispatch';

function loadFixture(fileName: string): string {
  return readFileSync(join(__dirname, 'fixtures', fileName), 'utf8');
}

describe('parseWorkflowDispatchTrigger', () => {
  test('detects shorthand string form: on: workflow_dispatch', () => {
    const parsed = YAML.parse(loadFixture('shorthand-string-trigger.yml'));
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: true,
      inputs: {},
    });
  });

  test('detects array form alongside other events', () => {
    const parsed = YAML.parse(
      loadFixture('array-trigger-with-workflow-dispatch.yml')
    );
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: true,
      inputs: {},
    });
  });

  test('array form without workflow_dispatch is not present', () => {
    const parsed = YAML.parse(
      loadFixture('array-trigger-without-workflow-dispatch.yml')
    );
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: false,
      inputs: {},
    });
  });

  test('parses inputs from the GitHub docs manual-trigger example', () => {
    const parsed = YAML.parse(
      loadFixture('manually-triggered-workflow-with-inputs.yml')
    );
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: true,
      inputs: {
        logLevel: {
          description: 'Log level',
          required: true,
          default: 'warning',
          type: 'choice',
          options: ['info', 'warning', 'debug'],
        },
        tags: {
          description: 'Test scenario tags',
          required: false,
          type: 'boolean',
        },
        environment: {
          description: 'Environment to run tests against',
          type: 'environment',
          required: true,
        },
      },
    });
  });

  test('workflow_dispatch declared with no inputs and combined with push', () => {
    const parsed = YAML.parse(
      loadFixture('workflow-dispatch-with-push-no-inputs.yml')
    );
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: true,
      inputs: {},
    });
  });

  test('object form without workflow_dispatch is not present', () => {
    const parsed = YAML.parse(
      loadFixture('object-trigger-without-workflow-dispatch.yml')
    );
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: false,
      inputs: {},
    });
  });

  test('missing on trigger entirely is not present', () => {
    const parsed = YAML.parse(loadFixture('no-on-trigger.yml'));
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: false,
      inputs: {},
    });
  });

  test('non-object parse result (e.g. empty workflow file) is not present', () => {
    const parsed = YAML.parse(loadFixture('empty-workflow.yml'));
    expect(parseWorkflowDispatchTrigger(parsed)).toEqual({
      present: false,
      inputs: {},
    });
    expect(parseWorkflowDispatchTrigger(null)).toEqual({
      present: false,
      inputs: {},
    });
  });
});
