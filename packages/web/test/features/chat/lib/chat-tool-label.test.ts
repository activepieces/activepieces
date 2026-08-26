import { mcpToolNameUtils } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { chatUtils } from '@/features/chat/lib/chat-utils';

const partFor = (toolName: string) =>
  ({ type: `tool-${toolName}`, toolCallId: 'call-1', state: 'output-available' } as never);

const labelFor = (toolName: string) =>
  chatUtils.formatToolLabel({ part: partFor(toolName) });

describe('the label a configured piece tool gets in the timeline', () => {
  // Read straight out, the generated name renders as
  // "Google-calendar-google Calendar Get Events 74s8ib Mcp".
  it('names the app and the action, without the hash or the marker', () => {
    const generated = mcpToolNameUtils.createPieceToolName(
      '@activepieces/piece-google-calendar',
      'google_calendar_get_events',
    );

    const label = labelFor(generated);

    expect(label).toBe('Google Calendar Get Events');
    // the generated name ends _<hash>_mcp; neither may reach the person
    const hash = /_([a-z0-9]{6})_mcp$/.exec(generated)?.[1] ?? '';
    expect(label).not.toContain(hash);
    expect(label).not.toMatch(/mcp/i);
  });

  it('keeps the action when it does not repeat the app', () => {
    const generated = mcpToolNameUtils.createPieceToolName(
      '@activepieces/piece-slack',
      'send_channel_message',
    );

    expect(labelFor(generated)).toBe('Slack Send Channel Message');
  });

  it('leaves a platform tool on the label it already had', () => {
    expect(labelFor('ap_web_search')).toBe('Searching the web');
  });

  it('leaves a name that was not generated alone', () => {
    expect(labelFor('some_helper')).toBe('Some Helper');
  });
});
