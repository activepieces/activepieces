import {
  EmptyTrigger,
  FieldType,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  LoopOnItemsAction,
  PieceAction,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { stageExcerptUtils } from '@/app/routes/chat-with-ai/lib/stage-excerpt';
import type { ClientField, ClientRecordData } from '@/features/tables';

const textField = (name: string): ClientField => ({
  uuid: `field-${name}`,
  name,
  type: FieldType.TEXT,
});

const record = (recordId: string, values: unknown[]): ClientRecordData => ({
  uuid: `record-${recordId}`,
  recordId,
  agentRunId: null,
  values: values.map((value, fieldIndex) => ({ fieldIndex, value })),
});

const createPieceAction = (
  name: string,
  displayName: string,
  pieceName: string,
  nextAction?: PieceAction,
): PieceAction => ({
  name,
  valid: true,
  displayName,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.PIECE,
  settings: {
    pieceName,
    pieceVersion: '~0.1.0',
    actionName: 'do_thing',
    input: {},
    propertySettings: {},
    errorHandlingOptions: {},
  },
  nextAction,
});

const createFlowVersion = (
  firstAction: LoopOnItemsAction | PieceAction,
): FlowVersion => {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: true,
    displayName: 'Every day',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: firstAction,
  };
  return {
    id: 'version-id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow-id',
    displayName: 'Competitor Intelligence Monitor',
    trigger,
    updatedBy: null,
    valid: true,
    schemaVersion: null,
    agentIds: [],
    state: FlowVersionState.DRAFT,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
};

describe('stageExcerptUtils.flowOutline', () => {
  it('lists the trigger, the loop, and the steps inside it in order', () => {
    const loop: LoopOnItemsAction = {
      name: 'step_1',
      valid: true,
      displayName: 'For each competitor',
      lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      type: FlowActionType.LOOP_ON_ITEMS,
      settings: { items: '{{trigger.items}}' },
      firstLoopAction: createPieceAction(
        'step_2',
        'Send Slack message',
        '@activepieces/piece-slack',
      ),
    };
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(loop));

    expect(outline).toContain('Trigger: Every day');
    expect(outline).toContain('Loop: For each competitor');
    expect(outline).toContain('Action: Send Slack message (slack)');
    expect(outline.indexOf('Loop: For each competitor')).toBeLessThan(
      outline.indexOf('Action: Send Slack message'),
    );
  });

  it('caps the outline at 30 steps with a "+N more" tail', () => {
    let chain: PieceAction | undefined;
    for (let i = 60; i >= 1; i--) {
      chain = createPieceAction(
        `step_${i}`,
        `Step ${i}`,
        '@activepieces/piece-slack',
        chain,
      );
    }
    const loop: LoopOnItemsAction = {
      name: 'loop',
      valid: true,
      displayName: 'Loop',
      lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      type: FlowActionType.LOOP_ON_ITEMS,
      settings: { items: '{{trigger.items}}' },
      firstLoopAction: chain,
    };
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(loop));

    expect(outline).toMatch(/\(\+\d+ more steps\)/);
    expect(outline).toContain('30.');
    expect(outline).not.toContain('31.');
  });

  it('marks the selected step and leaves the rest unmarked', () => {
    const loop: LoopOnItemsAction = {
      name: 'step_1',
      valid: true,
      displayName: 'For each competitor',
      lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      type: FlowActionType.LOOP_ON_ITEMS,
      settings: { items: '{{trigger.items}}' },
      firstLoopAction: createPieceAction(
        'step_2',
        'Send Slack message',
        '@activepieces/piece-slack',
      ),
    };
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(loop), {
      selectedStepName: 'step_2',
    });

    const slackLine = outline
      .split('\n')
      .find((line) => line.includes('Send Slack message'));
    expect(slackLine).toContain('← selected');
    expect(outline.match(/← selected/g)).toHaveLength(1);
  });

  it('marks nothing when no step is selected', () => {
    const trigger = createPieceAction(
      'step_2',
      'Send Slack message',
      '@activepieces/piece-slack',
    );
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(trigger));
    expect(outline).not.toContain('← selected');
  });
});

describe('stageExcerptUtils.flowOutline selected step detail', () => {
  const pieceActionWithInput = (
    input: Record<string, unknown>,
    valid = true,
  ): PieceAction => ({
    ...createPieceAction('step_2', 'Send Slack message', '@activepieces/piece-slack'),
    valid,
    settings: {
      pieceName: '@activepieces/piece-slack',
      pieceVersion: '~0.1.0',
      actionName: 'send_message',
      input,
      propertySettings: {},
      errorHandlingOptions: {},
    },
  });

  it('appends a detail block with the piece line and bulleted inputs', () => {
    const action = pieceActionWithInput({
      channel: '#general',
      text: 'Hello team',
    });
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(action), {
      selectedStepName: 'step_2',
    });

    expect(outline).toContain('Selected step "Send Slack message":');
    expect(outline).toContain('piece: slack · action: send_message');
    expect(outline).toContain('- channel: #general');
    expect(outline).toContain('- text: Hello team');
  });

  it('flags a step that needs setup', () => {
    const action = pieceActionWithInput({}, false);
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(action), {
      selectedStepName: 'step_2',
    });
    expect(outline).toContain('Selected step "Send Slack message" — needs setup:');
  });

  it('truncates a long string input value', () => {
    const action = pieceActionWithInput({ body: 'x'.repeat(500) });
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(action), {
      selectedStepName: 'step_2',
    });
    const bodyLine = outline
      .split('\n')
      .find((line) => line.includes('- body:'));
    expect(bodyLine).toContain('…');
    expect(bodyLine!.length).toBeLessThan(120);
  });

  it('summarizes array and object inputs instead of dumping them', () => {
    const action = pieceActionWithInput({
      recipients: ['a', 'b', 'c'],
      options: { foo: 1, bar: 2 },
    });
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(action), {
      selectedStepName: 'step_2',
    });
    expect(outline).toContain('- recipients: [3 items]');
    expect(outline).toContain('- options: {foo, bar}');
  });

  it('caps inputs with a "+N more inputs" tail', () => {
    const input: Record<string, unknown> = {};
    for (let i = 1; i <= 20; i++) {
      input[`field_${i}`] = `value_${i}`;
    }
    const action = pieceActionWithInput(input);
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(action), {
      selectedStepName: 'step_2',
    });
    expect(outline).toContain('- field_12: value_12');
    expect(outline).not.toContain('- field_13:');
    expect(outline).toMatch(/\(\+\d+ more inputs\)/);
  });

  it('does not append a detail block when no step is selected', () => {
    const action = pieceActionWithInput({ channel: '#general' });
    const outline = stageExcerptUtils.flowOutline(createFlowVersion(action));
    expect(outline).not.toContain('Selected step');
  });
});

describe('stageExcerptUtils.connectionsOutline', () => {
  it('lists each connection with its app, status, and flow count', () => {
    const outline = stageExcerptUtils.connectionsOutline({
      total: 3,
      connections: [
        {
          displayName: 'My Slack',
          pieceName: '@activepieces/piece-slack',
          status: 'ACTIVE',
          flowCount: 17,
        },
        {
          displayName: 'Gmail',
          pieceName: '@activepieces/piece-gmail',
          status: 'ACTIVE',
          flowCount: 0,
        },
        {
          displayName: 'Attio',
          pieceName: '@activepieces/piece-attio',
          status: 'ERROR',
          flowCount: 0,
        },
      ],
    });
    expect(outline).toContain('3 connections');
    expect(outline).toContain('My Slack — slack — ACTIVE — 17 flows');
    expect(outline).toContain('Gmail — gmail — ACTIVE — 0 flows');
    expect(outline).toContain('Attio — attio — ERROR — 0 flows');
  });

  it('singularizes a single flow and handles a missing count', () => {
    const outline = stageExcerptUtils.connectionsOutline({
      total: 1,
      connections: [{ displayName: 'Solo', status: 'ACTIVE', flowCount: 1 }],
    });
    expect(outline).toContain('1 connection.');
    expect(outline).toContain('Solo — unknown — ACTIVE — 1 flow');
  });
});

describe('stageExcerptUtils.tableOutline', () => {
  const fields = [
    textField('Name'),
    textField('Email'),
    textField('Impression'),
  ];
  const records = [
    record('rec_1', ['Adam Smith', 'adam@example.com', '12']),
    record('rec_2', ['Beth Jones', 'beth@example.com', '8']),
  ];

  it('lists the table name, columns, and each row with its values', () => {
    const outline = stageExcerptUtils.tableOutline({
      tableName: 'Students',
      fields,
      records,
      selectedCell: null,
      selectedRecords: new Set(),
    });

    expect(outline).toContain('Table "Students" — 2 rows.');
    expect(outline).toContain('Columns: Name · Email · Impression.');
    expect(outline).toContain('Name=Adam Smith');
    expect(outline).toContain('Impression=12');
    expect(outline).toContain('Name=Beth Jones');
  });

  it('tags every numbered row with its record id (the join key the agent acts on)', () => {
    const outline = stageExcerptUtils.tableOutline({
      tableName: 'Students',
      fields,
      records,
      selectedCell: null,
      selectedRecords: new Set(),
    });

    expect(outline).toContain('1. [id rec_1] Name=Adam Smith');
    expect(outline).toContain('2. [id rec_2] Name=Beth Jones');
    // The header tells the agent the bracketed id is authoritative and not to
    // re-fetch ids it already holds.
    expect(outline).toContain('ap_update_records');
  });

  it('marks the selected cell with its column name', () => {
    const outline = stageExcerptUtils.tableOutline({
      tableName: 'Students',
      fields,
      records,
      selectedCell: { rowIdx: 0, columnIdx: 3 },
      selectedRecords: new Set(),
    });

    const adamLine = outline
      .split('\n')
      .find((line) => line.includes('Adam Smith'));
    expect(adamLine).toContain('← selected (Impression)');
    expect(outline.match(/← selected/g)).toHaveLength(1);
  });

  it('marks selected rows by record id', () => {
    const outline = stageExcerptUtils.tableOutline({
      tableName: 'Students',
      fields,
      records,
      selectedCell: null,
      selectedRecords: new Set(['rec_2']),
    });

    const bethLine = outline
      .split('\n')
      .find((line) => line.includes('Beth Jones'));
    expect(bethLine).toContain('← selected');
    expect(outline.match(/← selected/g)).toHaveLength(1);
  });

  it('marks every row in a multi-cell range with its column names', () => {
    const outline = stageExcerptUtils.tableOutline({
      tableName: 'Students',
      fields,
      records,
      selectedCell: null,
      // columns 0–1 (Name, Email), rows 0–1 — range coords are 0-based over data
      // fields with no checkbox offset.
      selectedRange: { x: 0, y: 0, x1: 1, y1: 1 },
      selectedRecords: new Set(),
    });

    expect(outline.match(/← selected \(range: Name, Email\)/g)).toHaveLength(2);
  });

  it('renders empty cells and caps rows at 15 with a "+N more" tail', () => {
    const manyRecords = Array.from({ length: 20 }, (_, i) =>
      record(`rec_${i}`, [`Person ${i}`, '', `${i}`]),
    );
    const outline = stageExcerptUtils.tableOutline({
      tableName: 'People',
      fields,
      records: manyRecords,
      selectedCell: null,
      selectedRecords: new Set(),
    });

    expect(outline).toContain('Email=(empty)');
    expect(outline).toContain('15.');
    expect(outline).not.toContain('16.');
    expect(outline).toMatch(/\(\+\d+ more rows\)/);
  });
});
