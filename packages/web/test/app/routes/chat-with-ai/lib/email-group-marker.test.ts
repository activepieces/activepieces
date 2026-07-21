import { describe, expect, it } from 'vitest';

import {
  EmailGroupHastNode,
  emailGroupMarker,
} from '@/app/routes/chat-with-ai/lib/email-group-marker';

function emailPre(
  content: string,
  lang = 'language-email',
): EmailGroupHastNode {
  return {
    type: 'element',
    tagName: 'pre',
    children: [
      {
        type: 'element',
        tagName: 'code',
        properties: { className: [lang] },
        children: [{ type: 'text', value: content }],
      },
    ],
  };
}

function paragraph(text: string): EmailGroupHastNode {
  return {
    type: 'element',
    tagName: 'p',
    children: [{ type: 'text', value: text }],
  };
}

const hr = (): EmailGroupHastNode => ({ type: 'element', tagName: 'hr' });
const blank = (): EmailGroupHastNode => ({ type: 'text', value: '\n' });

function applyTo(children: EmailGroupHastNode[]): EmailGroupHastNode[] {
  const tree: EmailGroupHastNode = { type: 'root', children };
  emailGroupMarker.apply({ tree });
  return tree.children ?? [];
}

function countEmails(section: EmailGroupHastNode): number {
  return (section.children ?? []).filter((child) => child.tagName === 'pre')
    .length;
}

const LONG_INTRO =
  'Got everything I need. Here are five tailored, ready-to-send outreach emails, each one speaking directly to what that company and hiring manager care about most right now.';

describe('emailGroupMarker', () => {
  it('groups the real pattern: intro, then divider + label + email repeated', () => {
    const out = applyTo([
      paragraph(LONG_INTRO),
      hr(),
      paragraph('Row 1 — Docker · Roberta Carraro'),
      emailPre('Subject: A\n\nHi'),
      hr(),
      paragraph('Row 2 — Stripe · Katie Dill'),
      emailPre('Subject: B\n\nHi'),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].tagName).toBe('p');
    expect(out[1].tagName).toBe('section');
    expect(out[1].properties?.dataEmailGroup).toBe('true');
    expect(countEmails(out[1])).toBe(2);
  });

  it('keeps the intro paragraph outside the group', () => {
    const out = applyTo([
      paragraph(LONG_INTRO),
      hr(),
      paragraph('Row 1'),
      emailPre('a'),
      hr(),
      paragraph('Row 2'),
      emailPre('b'),
    ]);
    const sectionText = JSON.stringify(out[1]);
    expect(sectionText).not.toContain('Got everything I need');
  });

  it('groups bare consecutive email blocks', () => {
    const out = applyTo([emailPre('a'), emailPre('b')]);
    expect(out).toHaveLength(1);
    expect(out[0].tagName).toBe('section');
    expect(countEmails(out[0])).toBe(2);
  });

  it('tolerates blank whitespace between units', () => {
    const out = applyTo([
      emailPre('a'),
      blank(),
      hr(),
      blank(),
      paragraph('Two'),
      emailPre('b'),
    ]);
    expect(out).toHaveLength(1);
    expect(countEmails(out[0])).toBe(2);
  });

  it('does NOT group emails separated by a long prose paragraph', () => {
    const out = applyTo([emailPre('a'), paragraph(LONG_INTRO), emailPre('b')]);
    expect(out.map((node) => node.tagName)).toEqual(['pre', 'p', 'pre']);
  });

  it('leaves a single email block untouched', () => {
    const out = applyTo([paragraph('Row 1'), emailPre('only one')]);
    expect(out.some((node) => node.tagName === 'section')).toBe(false);
  });

  it('ignores non-email code blocks', () => {
    const out = applyTo([
      emailPre('a', 'language-js'),
      emailPre('b', 'language-js'),
    ]);
    expect(out.every((node) => node.tagName === 'pre')).toBe(true);
  });
});
