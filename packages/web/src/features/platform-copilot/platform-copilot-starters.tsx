import { t } from 'i18next';
import {
  Bot,
  Boxes,
  Cloud,
  Code2,
  Cpu,
  GitBranch,
  Lock,
  Network,
  Puzzle,
  Receipt,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

type StarterPrompt = {
  icon: LucideIcon;
  label: string;
  prompt: string;
};

type StarterSection = {
  label: string;
  prompts: StarterPrompt[];
};

const GRADIENT_ID = 'ap-copilot-starter-gradient';

const AI_GRADIENT_STROKE = { stroke: `url(#${GRADIENT_ID})` } as const;

export function CopilotStarters({
  onSelect,
}: {
  onSelect: (prompt: string) => void;
}) {
  const sections = buildSections();

  return (
    <div className="space-y-5">
      <svg
        width="0"
        height="0"
        aria-hidden
        className="absolute pointer-events-none"
      >
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>

      <div className="text-[14px] font-semibold text-foreground">
        {t('What do you want to explore today?')}
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.label}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {section.prompts.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onSelect(p.prompt)}
                    className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
                  >
                    <Icon
                      className="size-[20px] shrink-0 mt-0.5"
                      strokeWidth={1.75}
                      style={AI_GRADIENT_STROKE}
                    />
                    <span className="flex-1 min-w-0 text-[13px] font-medium leading-snug text-foreground/90 group-hover:text-foreground">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSections(): StarterSection[] {
  return [
    {
      label: t('Get started'),
      prompts: [
        {
          icon: Workflow,
          label: t('How do I build my first flow?'),
          prompt: t('How do I build my first flow?'),
        },
        {
          icon: Puzzle,
          label: t('What pieces are available out of the box?'),
          prompt: t('What pieces are available out of the box?'),
        },
        {
          icon: Network,
          label: t('How do I set up webhooks?'),
          prompt: t('How do I set up webhooks?'),
        },
        {
          icon: Bot,
          label: t('How do AI agents work inside flows?'),
          prompt: t('How do AI agents work inside flows?'),
        },
      ],
    },
    {
      label: t('Plans & deployment'),
      prompts: [
        {
          icon: Receipt,
          label: t('What plans does Activepieces offer?'),
          prompt: t('What plans does Activepieces offer?'),
        },
        {
          icon: Cloud,
          label: t('Self-host or cloud, which fits my team?'),
          prompt: t('Self-host or cloud, which fits my team?'),
        },
        {
          icon: Boxes,
          label: t('How do I deploy with Docker?'),
          prompt: t('How do I deploy with Docker?'),
        },
      ],
    },
    {
      label: t('Build on it'),
      prompts: [
        {
          icon: Code2,
          label: t('How do I write a custom piece?'),
          prompt: t('How do I write a custom piece?'),
        },
        {
          icon: GitBranch,
          label: t('How does the flow worker pick up jobs?'),
          prompt: t('How does the flow worker pick up jobs?'),
        },
        {
          icon: Lock,
          label: t('Where is authentication wired in the backend?'),
          prompt: t('Where is authentication wired in the backend?'),
        },
        {
          icon: Cpu,
          label: t('How is a step executed inside the engine?'),
          prompt: t('How is a step executed inside the engine?'),
        },
      ],
    },
    {
      label: t('Go deeper'),
      prompts: [
        {
          icon: Sparkles,
          label: t('What is the MCP integration about?'),
          prompt: t('What is the MCP integration about?'),
        },
        {
          icon: Network,
          label: t('Show me the flow execution architecture'),
          prompt: t('Show me the flow execution architecture'),
        },
      ],
    },
  ];
}
