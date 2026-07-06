import { describe, it, expect } from 'vitest';

import { pathHelpers } from './path-helpers';

describe('pathHelpers.propertyPathStarter', () => {
  it("appends ['output'] to the step name", () => {
    expect(pathHelpers.propertyPathStarter('step_1')).toBe("step_1['output']");
  });
});

describe('pathHelpers.convertValuePathToPropertyPath', () => {
  it("nests the value path under ['output'] using bracket notation", () => {
    expect(pathHelpers.convertValuePathToPropertyPath('step_1', 'name')).toBe(
      "step_1['output']['name']",
    );
  });

  it('keeps numeric array indices unquoted', () => {
    expect(
      pathHelpers.convertValuePathToPropertyPath('step_1', 'items[0].id'),
    ).toBe("step_1['output']['items'][0]['id']");
  });

  it('handles a top-level array index', () => {
    expect(pathHelpers.convertValuePathToPropertyPath('step_1', '[2]')).toBe(
      "step_1['output'][2]",
    );
  });

  it("returns just the ['output'] reference for an empty value path", () => {
    expect(pathHelpers.convertValuePathToPropertyPath('step_1', '')).toBe(
      "step_1['output']",
    );
  });

  it('escapes quotes in object keys', () => {
    expect(pathHelpers.convertValuePathToPropertyPath('step_1', "a'b")).toBe(
      "step_1['output']['a\\'b']",
    );
  });
});
