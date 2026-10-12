// @vitest-environment jsdom
import { AgentToolType } from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummariesByNames: ({ names }: { names: string[] }) => ({
      summaries: names.map((name) => ({
        name,
        displayName: name,
        logoUrl: '',
      })),
    }),
  },
}));
vi.mock('@/features/pieces/components/piece-icon', () => ({
  PieceIcon: ({ displayName }: { displayName: string }) => (
    <span data-testid="piece">{displayName}</span>
  ),
}));

import { TooltipProvider } from '@/components/ui/tooltip';
import { AgentToolStack } from '@/features/agents/agent-tool-stack';

describe('AgentToolStack', () => {
  it('counts the hidden tools, not the hidden tiles', () => {
    render(
      <TooltipProvider>
        <AgentToolStack
          toolCount={8}
          toolPieceNames={['gmail', 'slack', 'sheets']}
          toolTypes={[
            ...Array(3).fill(AgentToolType.PIECE),
            ...Array(5).fill(AgentToolType.FLOW),
          ]}
        />
      </TooltipProvider>,
    );

    expect(screen.getAllByTestId('piece')).toHaveLength(3);
    expect(overflowChips()).toEqual(['+5']);
  });

  it('shows an app once and counts every tool it has', () => {
    render(
      <TooltipProvider>
        <AgentToolStack
          toolCount={5}
          toolPieceNames={['gmail', 'gmail', 'gmail', 'slack', 'sheets']}
          toolTypes={Array(5).fill(AgentToolType.PIECE)}
        />
      </TooltipProvider>,
    );

    expect(
      screen.getAllByTestId('piece').map((element) => element.textContent),
    ).toEqual(['gmail', 'slack', 'sheets']);
    expect(overflowChips()).toEqual([]);
  });

  it('still counts tools when the server does not say what kind they are', () => {
    render(
      <TooltipProvider>
        <AgentToolStack toolCount={2} toolPieceNames={[]} />
      </TooltipProvider>,
    );

    expect(overflowChips()).toEqual(['+2']);
  });
});

function overflowChips(): (string | null)[] {
  return screen.queryAllByText(/^\+\d+$/).map((element) => element.textContent);
}
