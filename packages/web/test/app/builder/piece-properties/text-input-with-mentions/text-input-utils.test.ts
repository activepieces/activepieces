import { describe, expect, it } from 'vitest';

import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';

describe('textMentionUtils.parseLabelFromMention — flattenNestedKeys', () => {
  it('extracts the step name from the [\'output\']-nested form', () => {
    const label = textMentionUtils.parseLabelFromMention(
      "{{flattenNestedKeys(step_1['output'], ['items'])}}",
      [],
      [],
    );
    // Regex matched and pulled out the clean step name (not "flattenNestedKeys(step_1").
    expect(label.displayText).toBe('(Missing) step_1');
  });

  it('still parses the legacy (un-nested) form for backward compatibility', () => {
    const label = textMentionUtils.parseLabelFromMention(
      "{{flattenNestedKeys(step_1, ['items'])}}",
      [],
      [],
    );
    expect(label.displayText).toBe('(Missing) step_1');
  });
});
