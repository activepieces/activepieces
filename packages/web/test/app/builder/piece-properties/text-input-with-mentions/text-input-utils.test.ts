import { describe, expect, it } from 'vitest';

import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';

describe('textMentionUtils.parseLabelFromMention — flattenNestedKeys', () => {
  it("extracts the step name from the ['output']-nested form", () => {
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

describe('textMentionUtils.parseLabelFromMention: expressions render raw', () => {
  it('shows the || fallback on a variable chip', () => {
    const label = textMentionUtils.parseLabelFromMention(
      "{{ variables['X'] || 'fallback' }}",
      [],
      [],
    );
    expect(label.displayText).toBe("variables['X'] || 'fallback'");
    expect(label.isVariable).toBe(true);
    expect(label.serverValue).toBe("{{ variables['X'] || 'fallback' }}");
  });

  it('keeps a plain variable chip label friendly', () => {
    const label = textMentionUtils.parseLabelFromMention(
      "{{ variables['X'] }}",
      [],
      [],
    );
    expect(label.displayText).toBe('Variable · X');
  });

  it('shows a step expression whole instead of dot-splitting it', () => {
    const label = textMentionUtils.parseLabelFromMention(
      '{{ step_1.body.x || step_1.body.y }}',
      [],
      [],
    );
    expect(label.displayText).toBe('step_1.body.x || step_1.body.y');
  });

  it('shows a parenthesized expression whole', () => {
    const label = textMentionUtils.parseLabelFromMention(
      '{{ (step_1.body.x || step_1.body.y) }}',
      [],
      [],
    );
    expect(label.displayText).toBe('(step_1.body.x || step_1.body.y)');
  });

  it('keeps a pure accessor with array index on the friendly path', () => {
    const label = textMentionUtils.parseLabelFromMention(
      "{{ step_1['output'].items[0] }}",
      [],
      [],
    );
    expect(label.displayText).toBe('(Missing) step_1');
  });

  it('keeps an escaped-quote bracket key on the friendly path', () => {
    const label = textMentionUtils.parseLabelFromMention(
      "{{ step_1['output']['it\\'s here'] }}",
      [],
      [],
    );
    expect(label.displayText).toBe('(Missing) step_1');
  });

  it('keeps a non-ascii dot key on the friendly path', () => {
    const label = textMentionUtils.parseLabelFromMention(
      '{{ trigger.body.pełna }}',
      [],
      [],
    );
    expect(label.displayText).toBe('(Missing) trigger');
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

  describe('references inside quotes keep their mention node', () => {
    it.each([
      "\"{{step_4['output']['result']}}\"",
      '"{{step_4["output"]["result"]}}"',
      "'{{step_4.result}}'",
      'fullText contains "{{step_4.result}}',
      'ap-formula-v1::{upper("{{step_1.name}}")}::ap-formula-v1',
    ])('renders a mention for %j', (input) => {
      const paragraphs = convert(input);
      const hasMention = paragraphs[0].content.some(
        (node) => node.type === 'mention',
      );
      expect(hasMention).toBe(true);
    });

    it.each([
      "\"{{step_4['output']['result']}}\"",
      '"{{step_4["output"]["result"]}}"',
      '"{{step_1.name}} upper(x)"',
      'ap-formula-v1::{upper("(CEO); still inside")}::ap-formula-v1',
      'ap-formula-v1::{upper("pre {{step_1.name}} post")}::ap-formula-v1',
      'ap-formula-v1::{upper("(a) {{step_1.name}} (b); x")}::ap-formula-v1',
      'ap-formula-v1::{concat("{{a"}}; lower(x))}::ap-formula-v1',
      'ap-formula-v1::{upper("literal {{ braces }} here")}::ap-formula-v1',
      'ap-formula-v1::{upper({{step_1["a\'b"]}}; x)}::ap-formula-v1',
      "ap-formula-v1::{upper('pre {{step_1['output']['a\\'b']}} and lower(x)')}::ap-formula-v1",
    ])('round-trips %j losslessly', (input) => {
      const back = textMentionUtils.convertTiptapJsonToText({
        type: 'doc',
        content: convert(input),
      });
      expect(back).toBe(input);
    });
  });
});
