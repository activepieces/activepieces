import { t } from 'i18next';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  LucideIcon,
  Maximize2,
  MoreHorizontal,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useCopyToClipboard } from '@/components/custom/clipboard/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { ChatCard, ChatCardHeader, ChatCardTile } from '../chat-ui/chat-card';

export function PreviewIconButton({
  icon: Icon,
  label,
  onClick,
  href,
  size = 'icon-sm',
  className,
}: PreviewIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Button
            asChild
            variant="ghost"
            size={size}
            className={cn('text-gray-11', className)}
          >
            <a
              href={href}
              download
              target="_blank"
              rel="noreferrer"
              aria-label={label}
            >
              <Icon className="size-4" />
            </a>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size={size}
            type="button"
            onClick={onClick}
            aria-label={label}
            className={className}
          >
            <Icon className="size-4" />
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PreviewCard({
  icon,
  label,
  meta,
  actions = [],
  switcher,
  expandedSwitcher,
  expandedMeta,
  renderExpanded,
  expanded,
  onExpandedChange,
  children,
  className,
  bodyClassName,
}: PreviewCardProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = expanded ?? localExpanded;
  const setExpanded = onExpandedChange ?? setLocalExpanded;

  const expandAction: PreviewAction = {
    id: 'expand',
    icon: Maximize2,
    label: t('Expand'),
    onClick: () => setExpanded(true),
  };
  const cardActions = renderExpanded ? [...actions, expandAction] : actions;

  return (
    <ChatCard className={cn('my-3 w-full overflow-hidden', className)}>
      <ChatCardHeader
        tile={<ChatCardTile kind="file" icon={icon} />}
        title={label}
        meta={meta}
        trailing={
          <PreviewHeaderTrailing switcher={switcher} actions={cardActions} />
        }
      />
      <div
        className={cn(
          'min-w-0 overflow-hidden border-t border-gray-6',
          bodyClassName,
        )}
      >
        {children}
      </div>

      {renderExpanded && (
        <Dialog open={isExpanded} onOpenChange={setExpanded}>
          <DialogContent
            showCloseButton={false}
            className="flex h-[85vh] w-[90vw] max-w-5xl flex-col gap-0 overflow-hidden p-0"
          >
            <DialogTitle className="sr-only">{label}</DialogTitle>
            <ChatCardHeader
              tile={<ChatCardTile kind="file" icon={icon} />}
              title={label}
              meta={expandedMeta ?? meta}
              trailing={
                <>
                  {expandedSwitcher ?? switcher}
                  <PreviewActionRow actions={actions} />
                  <PreviewIconButton
                    icon={X}
                    label={t('Close')}
                    onClick={() => setExpanded(false)}
                    size="icon-xs"
                    className="text-gray-11"
                  />
                </>
              }
            />
            <div className="min-h-0 flex-1 overflow-auto border-t border-gray-6">
              {renderExpanded()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ChatCard>
  );
}

export function useCopyAction(text: string): PreviewAction {
  const { isCopied, copy } = useCopyToClipboard();
  return {
    id: 'copy',
    icon: isCopied ? Check : Copy,
    label: t('Copy'),
    onClick: () => copy(text),
  };
}

export function useOpenInNewTabAction({
  content,
  mimeType,
}: {
  content: string;
  mimeType: string;
}): PreviewAction {
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  return {
    id: 'open',
    icon: ExternalLink,
    label: t('Open in new tab'),
    onClick: () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const blob = new Blob([content], { type: mimeType });
      blobUrlRef.current = URL.createObjectURL(blob);
      window.open(blobUrlRef.current, '_blank', 'noopener,noreferrer');
    },
  };
}

export function buildDownloadAction({
  fileName,
  content,
  mimeType,
  extension,
}: {
  fileName: string;
  content: string;
  mimeType: string;
  extension: string;
}): PreviewAction {
  return {
    id: 'download',
    icon: Download,
    label: t('Download'),
    onClick: () => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  };
}

function PreviewHeaderTrailing({
  switcher,
  actions,
}: {
  switcher?: React.ReactNode;
  actions: PreviewAction[];
}) {
  const sorted = sortActions(actions);
  const folds = sorted.length > MAX_NARROW_ACTIONS;
  const kept = sorted.find((action) => action.id === 'download') ?? sorted[0];
  const folded = sorted.filter((action) => action !== kept);

  return (
    <>
      {switcher}
      <PreviewActionRow
        actions={sorted}
        className={cn(folds && '@max-chat-narrow/chat:hidden')}
      />
      {folds && kept && (
        <div
          data-testid="preview-actions-narrow"
          className="hidden items-center gap-0.5 @max-chat-narrow/chat:flex"
        >
          <PreviewActionButton action={kept} />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                type="button"
                className="text-gray-11"
                aria-label={t('More actions')}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {folded.map((action) => (
                <PreviewActionMenuItem key={action.id} action={action} />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
}

function PreviewActionRow({
  actions,
  className,
}: {
  actions: PreviewAction[];
  className?: string;
}) {
  if (actions.length === 0) return null;
  return (
    <div
      data-testid="preview-actions"
      className={cn('flex items-center gap-0.5', className)}
    >
      {sortActions(actions).map((action) => (
        <PreviewActionButton key={action.id} action={action} />
      ))}
    </div>
  );
}

function PreviewActionButton({ action }: { action: PreviewAction }) {
  return (
    <PreviewIconButton
      icon={action.icon}
      label={action.label}
      onClick={action.onClick}
      href={action.href}
      size="icon-xs"
      className="text-gray-11"
    />
  );
}

function PreviewActionMenuItem({ action }: { action: PreviewAction }) {
  const Icon = action.icon;
  if (action.href) {
    return (
      <DropdownMenuItem asChild>
        <a href={action.href} download target="_blank" rel="noreferrer">
          <Icon className="size-4" />
          {action.label}
        </a>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem onSelect={action.onClick}>
      <Icon className="size-4" />
      {action.label}
    </DropdownMenuItem>
  );
}

function sortActions(actions: PreviewAction[]): PreviewAction[] {
  return [...actions].sort(
    (a, b) => ACTION_ORDER.indexOf(a.id) - ACTION_ORDER.indexOf(b.id),
  );
}

const ACTION_ORDER: PreviewActionId[] = ['open', 'copy', 'download', 'expand'];

const MAX_NARROW_ACTIONS = 2;

type PreviewIconButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  size?: 'icon-sm' | 'icon-xs';
  className?: string;
};

export type PreviewActionId = 'open' | 'copy' | 'download' | 'expand';

export type PreviewAction = {
  id: PreviewActionId;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
};

export type PreviewCardProps = {
  icon: LucideIcon;
  label: string;
  meta?: string;
  actions?: PreviewAction[];
  switcher?: React.ReactNode;
  expandedSwitcher?: React.ReactNode;
  expandedMeta?: string;
  renderExpanded?: () => React.ReactNode;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};
