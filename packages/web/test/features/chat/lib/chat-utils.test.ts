import {
  ChatHistoryMessage,
  PersistedChatMessage,
  PersistedChatPartType,
  PersistedChatRole,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { AnyToolPart } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';

function buildPlanMessage(
  data: Record<string, unknown>,
  buildId = 'build_1',
): PersistedChatMessage {
  return {
    role: PersistedChatRole.ASSISTANT,
    parts: [{ type: PersistedChatPartType.BUILD_PLAN, buildId, data }],
  };
}

function legacyBuildPlanMessage(
  input: Record<string, unknown>,
  buildId = 'build_1',
): ChatHistoryMessage {
  return {
    role: 'assistant',
    content: '',
    toolCalls: [
      {
        toolCallId: `tc_${input.phase}`,
        title: 'ap_set_build_plan',
        status: 'completed',
        input,
        output: JSON.stringify({ ok: true, buildId }),
      },
    ],
  };
}

describe('chatUtils.extractFilesFromHistory', () => {
  it('groups produced file parts by toolCallId', () => {
    const data: PersistedChatMessage[] = [
      {
        role: PersistedChatRole.ASSISTANT,
        parts: [
          {
            type: PersistedChatPartType.FILE,
            toolCallId: 'call_code',
            fileId: 'file_1',
            url: 'https://example.com/file_1',
            mediaType: 'image/png',
            fileName: 'small.png',
            byteSize: 10,
            timestamp: '2026-01-01T00:00:00.000Z',
          },
          {
            type: PersistedChatPartType.FILE,
            toolCallId: 'call_code',
            fileId: 'file_2',
            url: 'https://example.com/file_2',
            mediaType: 'text/csv',
            fileName: 'data.csv',
            byteSize: 20,
            timestamp: '2026-01-01T00:00:01.000Z',
          },
        ],
      },
    ];
    const files = chatUtils.extractFilesFromHistory(data);
    expect(files['call_code']).toHaveLength(2);
    expect(files['call_code'][0]).toMatchObject({
      fileId: 'file_1',
      fileName: 'small.png',
    });
    expect(files['call_code'][1]).toMatchObject({
      fileId: 'file_2',
      mediaType: 'text/csv',
    });
  });

  it('returns an empty record when there are no file parts', () => {
    expect(
      chatUtils.extractFilesFromHistory([
        {
          role: PersistedChatRole.ASSISTANT,
          parts: [{ type: PersistedChatPartType.TEXT, text: 'hi' }],
        },
      ]),
    ).toEqual({});
  });
});

describe('chatUtils.extractBuildsFromHistory', () => {
  it('keeps the last build-plan part per buildId', () => {
    const data = [
      buildPlanMessage({
        phase: 'detecting',
        flowName: 'Lead triage',
        steps: [{ id: 'trigger', label: 'Trigger', status: 'pending' }],
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      buildPlanMessage({
        phase: 'done',
        flowName: 'Lead triage',
        tagline: 'Say goodbye to copy-pasting leads',
        iconName: 'users',
        flowId: 'flow_42',
        steps: [{ id: 'trigger', label: 'Trigger', status: 'done' }],
        updatedAt: '2026-01-01T00:05:00.000Z',
      }),
    ];

    const builds = chatUtils.extractBuildsFromHistory(data);

    expect(Object.keys(builds)).toEqual(['build_1']);
    expect(builds['build_1'].phase).toBe('done');
    expect(builds['build_1'].flowId).toBe('flow_42');
    expect(builds['build_1'].tagline).toBe('Say goodbye to copy-pasting leads');
    expect(builds['build_1'].iconName).toBe('users');
    expect(builds['build_1'].steps[0].status).toBe('done');
  });

  it('ignores malformed build-plan parts', () => {
    const builds = chatUtils.extractBuildsFromHistory([
      buildPlanMessage({ phase: 'nope', steps: 'not-an-array' }),
    ]);
    expect(builds).toEqual({});
  });

  it('returns an empty map for legacy history without build plans', () => {
    expect(
      chatUtils.extractBuildsFromHistory([
        { role: 'assistant', content: 'hello' },
      ]),
    ).toEqual({});
  });

  it('reconstructs a build from legacy history, keeping the furthest phase even when replayed out of order', () => {
    const builds = chatUtils.extractBuildsFromHistory([
      legacyBuildPlanMessage({
        phase: 'detecting',
        steps: [{ id: 'trigger', label: 'Trigger', status: 'pending' }],
      }),
      legacyBuildPlanMessage({
        phase: 'done',
        flowId: 'flow_42',
        flowName: 'Lead triage',
        steps: [{ id: 'trigger', label: 'Trigger', status: 'done' }],
      }),
      // The persisted model history replays earlier phases after 'done'; the
      // furthest phase must still win so the card shows the finished plan.
      legacyBuildPlanMessage({
        phase: 'building',
        steps: [{ id: 'trigger', label: 'Trigger', status: 'in_progress' }],
      }),
    ]);

    expect(Object.keys(builds)).toEqual(['build_1']);
    expect(builds['build_1'].phase).toBe('done');
    expect(builds['build_1'].flowId).toBe('flow_42');
    expect(builds['build_1'].steps[0].status).toBe('done');
  });
});

describe('chatUtils.mapHistoryToUIMessages — build-plan', () => {
  it('maps a build-plan part to an ap_set_build_plan tool part carrying the buildId', () => {
    const [message] = chatUtils.mapHistoryToUIMessages([
      buildPlanMessage({
        phase: 'building',
        flowName: 'X',
        steps: [{ id: 'a', label: 'A', status: 'pending' }],
      }),
    ]);

    const part = message.parts[0];
    expect(part.type).toBe('dynamic-tool');
    if (part.type !== 'dynamic-tool') throw new Error('expected dynamic-tool');
    expect(part.toolName).toBe('ap_set_build_plan');
    expect(part.state).toBe('output-available');
    expect(JSON.parse(String(part.output))).toMatchObject({
      buildId: 'build_1',
    });
    expect(part.input).toMatchObject({ phase: 'building' });
  });
});

function toolPart(
  toolName: string,
  input: Record<string, unknown>,
): AnyToolPart {
  return {
    type: 'dynamic-tool',
    toolCallId: 'tc_1',
    toolName,
    state: 'output-available',
    input,
    output: JSON.stringify({ success: true }),
  };
}

describe('chatUtils — tool pill active/done labels', () => {
  it('uses the model-authored activeTitle (-ing) and doneTitle (-ed) when provided', () => {
    const part = toolPart('ap_generate_image', {
      activeTitle: 'Designing your Instagram post',
      doneTitle: 'Designed your Instagram post',
      caption: 'Neon launch banner for the spring sale',
      prompt: 'a neon banner',
      style: 'graphic_text',
    });

    expect(chatUtils.formatToolActionName({ part })).toBe(
      'Designing your Instagram post',
    );
    expect(chatUtils.formatToolDoneTitle({ part })).toBe(
      'Designed your Instagram post',
    );
  });

  it('never leaks the bare title into the active label — falls back to the -ing form', () => {
    const part = toolPart('ap_research_pieces', {
      title: 'Search integrations',
    });

    // Regression: previously the active pill showed the bare "Search integrations".
    expect(chatUtils.formatToolActionName({ part })).toBe(
      'Searching integrations',
    );
    expect(chatUtils.formatToolDoneTitle({ part })).toBe(
      'Searched integrations',
    );
  });

  it('falls back to a generic image label when the model omits the titles', () => {
    const part = toolPart('ap_generate_image', {
      caption: 'A friendly mascot',
    });

    expect(chatUtils.formatToolActionName({ part })).toBe('Generating image');
    expect(chatUtils.formatToolDoneTitle({ part })).toBe('Generated image');
    expect(chatUtils.formatToolActionName({ part })).not.toContain('mascot');
  });
});
