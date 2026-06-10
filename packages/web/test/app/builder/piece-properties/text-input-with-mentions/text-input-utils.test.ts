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

const convert = (text: string) =>
  textMentionUtils.convertTextToTipTapJsonContent(text, [], []);

describe('textMentionUtils.convertTextToTipTapJsonContent', () => {
  describe('unclosed "{{" does not hang the tokenizer', () => {
    // Before the fix these inputs spun forever in tokenizeExpression and froze
    // the tab; an infinite loop now surfaces as a vitest timeout instead.
    it.each(['{{', '{{foo', 'text {{', '{{foo bar baz', '{{a}} {{b'])(
      'returns for %j',
      (input) => {
        expect(() => convert(input)).not.toThrow();
        expect(convert(input)).toBeDefined();
      },
    );

    it('keeps unclosed "{{" as literal text', () => {
      const paragraphs = convert('{{foo');
      const text = paragraphs[0].content
        .filter((node) => node.type === 'text')
        .map((node) => node.text)
        .join('');
      expect(text).toBe('{{foo');
    });
  });

  it('renders a complete "{{ ... }}" as a mention node', () => {
    const paragraphs = convert('{{step_1.field}}');
    const hasMention = paragraphs[0].content.some(
      (node) => node.type === 'mention',
    );
    expect(hasMention).toBe(true);
  });
});
