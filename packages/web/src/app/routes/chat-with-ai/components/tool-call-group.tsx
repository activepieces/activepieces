import { ToolCallItem } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Loader2 } from 'lucide-react';

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from '@/components/prompt-kit/chain-of-thought';
import {
  extractToolContext,
  ToolCallCard,
} from '@/features/chat/components/tool-call-card';

export function ToolCallGroup({ toolCalls }: { toolCalls: ToolCallItem[] }) {
  const groups = groupToolCallsByPhase(toolCalls);

  if (groups.length === 0) return null;

  return (
    <ChainOfThought>
      {groups.map((group, i) => {
        const groupDone = group.tools.every((tc) => tc.status !== 'running');
        return (
          <ChainOfThoughtStep key={i} defaultOpen={false}>
            <ChainOfThoughtTrigger
              leftIcon={
                groupDone ? (
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )
              }
            >
              {group.label}
            </ChainOfThoughtTrigger>
            <ChainOfThoughtContent>
              <div className="space-y-0.5">
                {group.tools.map((tc) => (
                  <ToolCallCard key={tc.id} toolCall={tc} />
                ))}
              </div>
            </ChainOfThoughtContent>
          </ChainOfThoughtStep>
        );
      })}
    </ChainOfThought>
  );
}

export function groupToolCallsByPhase(
  toolCalls: ToolCallItem[],
): Array<{ label: string; tools: ToolCallItem[] }> {
  const visible = toolCalls.filter((tc) => !isUtilityTool(tc.title || tc.name));
  if (visible.length === 0) return [];

  if (visible.length <= 4) {
    return [{ label: describeToolCalls(visible), tools: visible }];
  }

  const groups: Array<{ label: string; tools: ToolCallItem[] }> = [];
  let current: ToolCallItem[] = [];

  for (const tc of visible) {
    current.push(tc);
    if (current.length >= 4) {
      groups.push({ label: describeToolCalls(current), tools: [...current] });
      current = [];
    }
  }
  if (current.length > 0) {
    groups.push({ label: describeToolCalls(current), tools: current });
  }

  return groups;
}

export function describeToolCalls(toolCalls: ToolCallItem[]): string {
  const contexts: string[] = [];
  let primaryAction = '';

  for (const tc of toolCalls) {
    const name = (tc.title || tc.name).toLowerCase();
    const ctx = extractToolContext(tc);
    if (ctx && !contexts.includes(ctx)) contexts.push(ctx);

    if (!primaryAction) {
      if (name.includes('build_flow') || name.includes('create_flow'))
        primaryAction = 'build';
      else if (name.includes('update_trigger')) primaryAction = 'trigger';
      else if (name.includes('add_step')) primaryAction = 'add';
      else if (name.includes('update_step') || name.includes('test_step'))
        primaryAction = 'configure';
      else if (name.includes('test_flow')) primaryAction = 'test';
      else if (name.includes('list_pieces') || name.includes('get_piece_props'))
        primaryAction = 'explore';
      else if (name.includes('list_connections')) primaryAction = 'connections';
      else if (name.includes('list_flows') || name.includes('flow_structure'))
        primaryAction = 'flows';
      else if (name.includes('list_tables') || name.includes('find_records'))
        primaryAction = 'data';
      else if (
        name.includes('lock_and_publish') ||
        name.includes('change_flow_status')
      )
        primaryAction = 'publish';
    }
  }

  const subject = contexts.slice(0, 2).join(' & ');

  switch (primaryAction) {
    case 'build':
      return subject
        ? t('Creating {subject} flow', { subject })
        : t('Creating the flow');
    case 'trigger':
      return subject
        ? t('Setting up {subject} trigger', { subject })
        : t('Setting up the trigger');
    case 'add':
      return subject
        ? t('Adding {subject} step', { subject })
        : t('Adding a new step');
    case 'configure':
      return subject
        ? t('Configuring {subject}', { subject })
        : t('Wiring up the steps');
    case 'test':
      return subject ? t('Testing {subject}', { subject }) : t('Running tests');
    case 'explore':
      return subject
        ? t('Looking up {subject}', { subject })
        : t('Exploring integrations');
    case 'connections':
      return t('Checking connections');
    case 'flows':
      return t('Reviewing your flows');
    case 'data':
      return t('Querying your data');
    case 'publish':
      return t('Publishing the flow');
    default:
      return t('Working on it');
  }
}

export function isUtilityTool(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('toolsearch') || lower.includes('tool_search');
}
