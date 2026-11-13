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

const CUSTOMER_SQL = `SELECT
  regexp_extract(link, 'projects/([^/]+)/flows/([^/]+)', 1) AS project_id,
  list_filter(
    list_transform(string_split(pieces_used, ','), x -> trim(x)),
    x -> x != ''
  ) AS pieces_used
FROM glad`;

const roundTrip = (text: string) =>
  textMentionUtils.convertTiptapJsonToText({
    type: 'doc',
    content: convert(text),
  });

describe('plain text is never turned into function nodes', () => {
  it('leaves SQL built from function-like names untouched across saves', () => {
    const firstSave = roundTrip(CUSTOMER_SQL);
    expect(firstSave).toBe(CUSTOMER_SQL);
    expect(roundTrip(firstSave)).toBe(CUSTOMER_SQL);
  });

  it.each([
    "string_split(pieces_used, ',')",
    'SELECT trim(x) FROM t',
    'plain ) ; text with upper( unbalanced',
  ])('renders %j as text only', (input) => {
    expect(convert(input)[0].content.map((node) => node.type)).toEqual([
      'text',
    ]);
  });

  it('keeps function nodes for wrapped formulas', () => {
    const types = convert(
      'ap-formula-v1::{upper(a)}::ap-formula-v1',
    )[0].content.map((node) => node.type);
    expect(types).toContain('function_start');
  });

  it('round-trips text and a formula living in the same value', () => {
    const input =
      'hello foo(x) ap-formula-v1::{upper(y)}::ap-formula-v1 tail lower(z)';
    expect(roundTrip(input)).toBe(input);
    expect(roundTrip(roundTrip(input))).toBe(input);
  });
});

describe('an unmatched formula marker stays literal text', () => {
  it.each([
    'literal ap-formula-v1::{ typed by hand',
    'ap-formula-v1::{',
    'prefix ap-formula-v1::{ and no suffix at all',
    'ap-formula-v1::{uppercase(a',
  ])('round-trips %j without eating the marker', (input) => {
    expect(roundTrip(input)).toBe(input);
    expect(roundTrip(roundTrip(input))).toBe(input);
  });

  it.each([
    'literal ap-formula-v1::{ then ap-formula-v1::{upper(y)}::ap-formula-v1 tail',
    'ap-formula-v1::{ ap-formula-v1::{trim(a)}::ap-formula-v1',
  ])(
    'keeps an unmatched marker that precedes a complete formula: %j',
    (input) => {
      expect(roundTrip(input)).toBe(input);
      expect(roundTrip(roundTrip(input))).toBe(input);
    },
  );

  it('still builds a function node once the suffix is present', () => {
    const types = convert(
      'ap-formula-v1::{uppercase(a)}::ap-formula-v1',
    )[0].content.map((node) => node.type);
    expect(types).toContain('function_start');
  });
});
