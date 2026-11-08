import { t } from 'i18next';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { useResourceName } from '@/features/chat/lib/resources/resource-names';
import { cn } from '@/lib/utils';

import { onResourceLinkClick } from './changes-summary';

export function ResourceChips({
  parts,
  className,
}: {
  parts: AnyToolPart[];
  className?: string;
}) {
  const resources = useMemo(() => {
    const seen = new Map<string, ResourceRef>();
    for (const part of parts) {
      const resource = resourceOfPart(part);
      if (!resource) continue;
      const key = resourceRegistry.keyOf(resource);
      const known = seen.get(key);
      if (!known || (!known.name && resource.name)) seen.set(key, resource);
    }
    return [...seen.values()];
  }, [parts]);
  if (resources.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {resources.map((resource) => (
        <ResourceChip
          key={resourceRegistry.keyOf(resource)}
          resource={resource}
        />
      ))}
    </div>
  );
}

export function ToolResourceChip({
  part,
  className,
}: {
  part: AnyToolPart;
  className?: string;
}) {
  const resource = resourceOfPart(part);
  return resource ? (
    <div className={className}>
      <ResourceChip resource={resource} />
    </div>
  ) : null;
}

function ResourceChip({ resource }: { resource: ResourceRef }) {
  const { pathname } = useLocation();
  const name = useResourceName(resource);
  const here = resourceRegistry.isOn(pathname, resource);
  const {
    icon: Icon,
    label: kindLabel,
    noun,
  } = resourceRegistry.kindInfo(resource.kind);
  const label = name ? withNoun(name, noun) : kindLabel;

  return (
    <a
      href={resourceRegistry.route(resource)}
      onClick={(event) => onResourceLinkClick({ event, resource })}
      aria-current={here ? 'page' : undefined}
      title={here ? undefined : t('Open beside the chat')}
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-gray-6 bg-gray-1 pl-2 pr-2.5 text-xs transition-colors hover:border-gray-7 hover:bg-gray-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8"
    >
      <Icon className="size-3.5 shrink-0 text-gray-11" aria-hidden />
      <span className="truncate text-gray-12">{label}</span>
      <span className="text-gray-8" aria-hidden>
        ·
      </span>
      <span
        className={cn(
          'shrink-0',
          here ? 'text-gray-11' : 'font-medium text-accent-11',
        )}
      >
        {here ? t('Viewing') : t('Open')}
      </span>
    </a>
  );
}

function resourceOfPart(part: AnyToolPart): ResourceRef | null {
  if (part.state !== 'output-available') return null;
  const resolved = resourceRegistry.resolve({
    toolName: chatPartUtils.getToolPartName(part),
    input: part.input,
    output: part.output,
  });
  if (
    !resolved ||
    resolved.op === 'delete' ||
    !resourceRegistry.isChange(resolved.outcome)
  ) {
    return null;
  }
  return resolved.ref;
}

function withNoun(name: string, noun: string): string {
  return name.toLowerCase().endsWith(noun.toLowerCase())
    ? name
    : `${name} ${noun}`;
}
