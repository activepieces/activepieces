import { describe, expect, it } from 'vitest';

import {
  getTextFromBlocks,
  parseAllConnectionsRequired,
  parseAutomationProposal,
  parseCodeBlock,
  parseQuickReplies,
} from '@/app/routes/chat-with-ai/lib/message-parsers';

import type { MessageBlock } from '@activepieces/shared';

describe('getTextFromBlocks', () => {
  it('returns empty string for empty array', () => {
    expect(getTextFromBlocks([])).toBe('');
  });

  it('extracts text from a single text block', () => {
    const blocks: MessageBlock[] = [{ type: 'text', text: 'hello world' }];
    expect(getTextFromBlocks(blocks)).toBe('hello world');
  });

  it('concatenates multiple text blocks', () => {
    const blocks: MessageBlock[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ' world' },
    ];
    expect(getTextFromBlocks(blocks)).toBe('Hello world');
  });

  it('ignores tool_calls blocks', () => {
    const blocks: MessageBlock[] = [
      {
        type: 'tool_calls',
        calls: [
          {
            id: 'tc1',
            name: 'build_flow',
            title: 'Build flow',
            status: 'completed',
          },
        ],
      },
    ];
    expect(getTextFromBlocks(blocks)).toBe('');
  });

  it('extracts text from mixed text and tool_calls blocks', () => {
    const blocks: MessageBlock[] = [
      { type: 'text', text: 'Starting...' },
      {
        type: 'tool_calls',
        calls: [
          {
            id: 'tc1',
            name: 'build_flow',
            title: 'Build flow',
            status: 'running',
          },
        ],
      },
      { type: 'text', text: ' Done.' },
    ];
    expect(getTextFromBlocks(blocks)).toBe('Starting... Done.');
  });

  it('returns empty string when all blocks are tool_calls', () => {
    const blocks: MessageBlock[] = [
      {
        type: 'tool_calls',
        calls: [
          {
            id: 'tc1',
            name: 'add_step',
            title: 'Add step',
            status: 'completed',
          },
        ],
      },
    ];
    expect(getTextFromBlocks(blocks)).toBe('');
  });
});

describe('parseCodeBlock', () => {
  it('extracts content inside a fenced code block', () => {
    const content = '```quick-replies\n- Yes\n- No\n```';
    const result = parseCodeBlock(content, 'quick-replies');
    expect(result.block).toBe('- Yes\n- No');
  });

  it('removes the fence from cleanContent', () => {
    const prefix = 'Here are replies:\n';
    const content = `${prefix}\`\`\`quick-replies\n- Yes\n- No\n\`\`\``;
    const result = parseCodeBlock(content, 'quick-replies');
    expect(result.cleanContent).toBe(prefix.trim());
  });

  it('returns null block when fence name does not match', () => {
    const content = '```json\n{"key":"value"}\n```';
    const result = parseCodeBlock(content, 'quick-replies');
    expect(result.block).toBeNull();
    expect(result.cleanContent).toBe(content);
  });

  it('handles empty code block', () => {
    const content = '```quick-replies\n\n```';
    const result = parseCodeBlock(content, 'quick-replies');
    expect(result.block).toBe('');
  });

  it('handles whitespace around fence name', () => {
    const content = '```  quick-replies  \n- Option\n```';
    const result = parseCodeBlock(content, 'quick-replies');
    expect(result.block).toBe('- Option');
  });

  it('collapses triple+ newlines in cleanContent', () => {
    const content = 'Before\n\n\n\n```quick-replies\n- Yes\n```\n\n\n\nAfter';
    const result = parseCodeBlock(content, 'quick-replies');
    expect(result.cleanContent).not.toMatch(/\n{3,}/);
    expect(result.cleanContent).toContain('Before');
    expect(result.cleanContent).toContain('After');
  });
});

describe('parseQuickReplies', () => {
  it('parses valid quick-replies block', () => {
    const content = '```quick-replies\n- Yes\n- No\n- Maybe\n```';
    const result = parseQuickReplies(content);
    expect(result.replies).toEqual(['Yes', 'No', 'Maybe']);
  });

  it('returns empty replies when no quick-replies block present', () => {
    const content = 'Just some plain text.';
    const result = parseQuickReplies(content);
    expect(result.replies).toEqual([]);
    expect(result.cleanContent).toBe('Just some plain text.');
  });

  it('filters lines that do not start with "- "', () => {
    const content = '```quick-replies\n- Valid\nInvalid line\n* Also invalid\n```';
    const result = parseQuickReplies(content);
    expect(result.replies).toEqual(['Valid']);
  });

  it('filters replies longer than or equal to 80 characters', () => {
    const longReply = 'A'.repeat(80);
    const content = `\`\`\`quick-replies\n- ${longReply}\n- Short\n\`\`\``;
    const result = parseQuickReplies(content);
    expect(result.replies).toEqual(['Short']);
  });

  it('keeps replies exactly under 80 characters', () => {
    const replyOf79 = 'A'.repeat(79);
    const content = `\`\`\`quick-replies\n- ${replyOf79}\n\`\`\``;
    const result = parseQuickReplies(content);
    expect(result.replies).toEqual([replyOf79]);
  });

  it('strips leading "- " from each reply', () => {
    const content = '```quick-replies\n- Trim me\n```';
    const result = parseQuickReplies(content);
    expect(result.replies[0]).toBe('Trim me');
  });

  it('removes the code block from cleanContent', () => {
    const content = 'Intro\n```quick-replies\n- Yes\n```';
    const result = parseQuickReplies(content);
    expect(result.cleanContent).not.toContain('quick-replies');
    expect(result.cleanContent).toContain('Intro');
  });
});

describe('parseAutomationProposal', () => {
  const validBlock = [
    '```automation-proposal',
    'title: Send Slack notification',
    'description: When a form is submitted, send a Slack message',
    '- Trigger: New form submission',
    '- Action: Send Slack message',
    '```',
  ].join('\n');

  it('parses a valid automation proposal', () => {
    const result = parseAutomationProposal(validBlock);
    expect(result.proposal).not.toBeNull();
    expect(result.proposal?.title).toBe('Send Slack notification');
    expect(result.proposal?.description).toBe(
      'When a form is submitted, send a Slack message',
    );
    expect(result.proposal?.steps).toEqual([
      'Trigger: New form submission',
      'Action: Send Slack message',
    ]);
  });

  it('returns null proposal when no automation-proposal block present', () => {
    const result = parseAutomationProposal('No code block here.');
    expect(result.proposal).toBeNull();
    expect(result.cleanContent).toBe('No code block here.');
  });

  it('returns null proposal when title is missing', () => {
    const content = [
      '```automation-proposal',
      'description: Some description',
      '- Step 1',
      '```',
    ].join('\n');
    const result = parseAutomationProposal(content);
    expect(result.proposal).toBeNull();
  });

  it('returns null proposal when no steps are present', () => {
    const content = [
      '```automation-proposal',
      'title: My Automation',
      'description: Does something',
      '```',
    ].join('\n');
    const result = parseAutomationProposal(content);
    expect(result.proposal).toBeNull();
  });

  it('handles optional description (uses empty string when missing)', () => {
    const content = [
      '```automation-proposal',
      'title: My Automation',
      '- Step 1',
      '- Step 2',
      '```',
    ].join('\n');
    const result = parseAutomationProposal(content);
    expect(result.proposal).not.toBeNull();
    expect(result.proposal?.description).toBe('');
    expect(result.proposal?.steps).toHaveLength(2);
  });

  it('removes the code block from cleanContent', () => {
    const surroundedContent = `Intro text\n${validBlock}\nOutro text`;
    const result = parseAutomationProposal(surroundedContent);
    expect(result.cleanContent).not.toContain('automation-proposal');
    expect(result.cleanContent).toContain('Intro text');
    expect(result.cleanContent).toContain('Outro text');
  });
});

describe('parseAllConnectionsRequired', () => {
  it('parses a single connection-required block', () => {
    const content = [
      '```connection-required',
      'piece: @activepieces/piece-slack',
      'displayName: Slack',
      '```',
    ].join('\n');
    const result = parseAllConnectionsRequired(content);
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0].piece).toBe('@activepieces/piece-slack');
    expect(result.connections[0].displayName).toBe('Slack');
  });

  it('parses multiple connection-required blocks', () => {
    const content = [
      '```connection-required',
      'piece: @activepieces/piece-slack',
      'displayName: Slack',
      '```',
      'Some text in between.',
      '```connection-required',
      'piece: @activepieces/piece-gmail',
      'displayName: Gmail',
      '```',
    ].join('\n');
    const result = parseAllConnectionsRequired(content);
    expect(result.connections).toHaveLength(2);
    expect(result.connections[0].piece).toBe('@activepieces/piece-slack');
    expect(result.connections[1].piece).toBe('@activepieces/piece-gmail');
  });

  it('skips blocks missing a piece field', () => {
    const content = [
      '```connection-required',
      'displayName: Slack',
      '```',
    ].join('\n');
    const result = parseAllConnectionsRequired(content);
    expect(result.connections).toHaveLength(0);
  });

  it('falls back to piece as displayName when displayName field is absent', () => {
    const content = [
      '```connection-required',
      'piece: @activepieces/piece-slack',
      '```',
    ].join('\n');
    const result = parseAllConnectionsRequired(content);
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0].displayName).toBe('@activepieces/piece-slack');
  });

  it('removes all connection-required blocks from cleanContent', () => {
    const content = [
      'Please connect the following:',
      '```connection-required',
      'piece: @activepieces/piece-slack',
      'displayName: Slack',
      '```',
      '```connection-required',
      'piece: @activepieces/piece-gmail',
      'displayName: Gmail',
      '```',
      'Then proceed.',
    ].join('\n');
    const result = parseAllConnectionsRequired(content);
    expect(result.cleanContent).not.toContain('connection-required');
    expect(result.cleanContent).toContain('Please connect the following:');
    expect(result.cleanContent).toContain('Then proceed.');
  });

  it('returns empty connections and trimmed content for plain text', () => {
    const result = parseAllConnectionsRequired('  No connections here.  ');
    expect(result.connections).toHaveLength(0);
    expect(result.cleanContent).toBe('No connections here.');
  });
});
