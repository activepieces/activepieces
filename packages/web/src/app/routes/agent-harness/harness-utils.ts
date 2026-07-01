// Rough token estimate — good enough to compare the relative weight of prompt
// sections and guides in the context budget, not an exact tokenizer count.
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return `${tokens}`;
}

// The system prompt is organised as top-level <tag>…</tag> sections at column 0.
// Pull each into its own block so the console can show an outline + per-section
// token weight. Nested tags inside a section stay as content (we only close on
// the matching open tag).
function parseSystemPromptSections(
  prompt: string,
): { tag: string; content: string; tokens: number }[] {
  const lines = prompt.split('\n');
  const sections: { tag: string; content: string; tokens: number }[] = [];
  let current: { tag: string; lines: string[] } | null = null;

  for (const line of lines) {
    const open = line.match(/^<([a-z_]+)>\s*$/);
    if (!current && open) {
      current = { tag: open[1], lines: [] };
      continue;
    }
    if (current && line.match(new RegExp(`^</${current.tag}>\\s*$`))) {
      const content = current.lines.join('\n').trim();
      sections.push({
        tag: current.tag,
        content,
        tokens: estimateTokens(content),
      });
      current = null;
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
  return sections;
}

const BEST_PRACTICE_SCORECARD: HarnessScorecardRow[] = [
  {
    practice: 'Sectioned system prompt (XML tags)',
    status: 'implemented',
    detail:
      '21 delineated <tag> sections (identity, persona, guardrails, discovery…).',
    ref: 'assets/prompts/chat-system-prompt.md',
  },
  {
    practice: 'Just-in-time knowledge retrieval',
    status: 'implemented',
    detail: '9 topic guides loaded on demand via ap_load_guide, not always-on.',
    ref: 'assets/prompts/guides/*.md',
  },
  {
    practice: 'Two-phase tool gating (state machine)',
    status: 'implemented',
    detail: 'Discovery hides build-only tools until the agent starts building.',
    ref: 'core/shared/.../tool-phases.ts',
  },
  {
    practice: 'Deterministic write/approval gates',
    status: 'partial',
    detail:
      'Write actions gate on approval by name pattern; no explicit per-tool risk tier yet.',
    ref: 'core/shared/.../tool-classification.ts',
  },
  {
    practice: 'Context engineering (compaction)',
    status: 'implemented',
    detail:
      'Conversation compaction past ~200k tokens; large tool results offloaded.',
    ref: 'ee/chat/chat-compaction.ts',
  },
  {
    practice: 'Emphasis calibrated to model',
    status: 'gap',
    detail:
      'Prompt still uses CRITICAL/MUST/NEVER emphasis newer models over-trigger on.',
    ref: 'assets/prompts/chat-system-prompt.md',
  },
  {
    practice: 'Actionable tool error messages',
    status: 'partial',
    detail:
      'Some tools return guidance; not yet a consistent ACI pass across all ap_* tools.',
    ref: 'worker/.../chat-worker-tools.ts',
  },
  {
    practice: 'Versioned golden set + LLM judge',
    status: 'implemented',
    detail:
      '21 fixtures with deterministic assertions + judge, TPR/TNR calibration.',
    ref: 'worker/test/lib/chat-eval/',
  },
  {
    practice: 'CI regression gate on behavior',
    status: 'partial',
    detail:
      'chat-evals:ci exists; gated on a provider key being present in CI.',
    ref: 'npm run chat-evals:ci',
  },
  {
    practice: 'Invariant registry',
    status: 'implemented',
    detail:
      '54 pinned behaviors; AGT-14 (ambient context) / AGT-15 (large data) are open gaps.',
    ref: 'worker/test/lib/chat-eval/INVARIANTS.md',
  },
];

export const harnessUtils = {
  estimateTokens,
  formatTokens,
  parseSystemPromptSections,
  scorecard: BEST_PRACTICE_SCORECARD,
};

export type HarnessSources = {
  system: string;
  projectSelected: string;
  noProject: string;
  guides: Record<string, string>;
};

export type HarnessScorecardRow = {
  practice: string;
  status: 'implemented' | 'partial' | 'gap';
  detail: string;
  ref: string;
};
