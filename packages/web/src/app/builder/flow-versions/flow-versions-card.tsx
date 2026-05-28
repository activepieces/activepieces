import {
  FlowVersionMetadata,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { EllipsisVertical, Eye, EyeIcon, Pencil } from 'lucide-react';
import React, { useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { CardListItem } from '@/components/custom/card-list';
import { FormattedDate } from '@/components/custom/formatted-date';
import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
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
import { FlowVersionStateDot, flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { OverwriteDraftDialog } from './overwrite-draft-dialog';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

const FlowVersionDetailsCard = React.memo(
  ({
    flowVersion,
    selected,
    publishedVersionId,
    flowVersionNumber,
  }: FlowVersionDetailsCardProps) => {
    const { checkAccess } = useAuthorization();
    const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
    const [setVersion, setReadonly] = useBuilderStateContext((state) => [
      state.setVersion,
      state.setReadOnly,
    ]);
    const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(flowVersion.versionName ?? '');
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { mutate: setVersionName } = flowHooks.useSetVersionName({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['flow-versions', flowVersion.flowId] });
        setEditingName(false);
      },
    });

    const commitName = () => {
      setVersionName({ flowId: flowVersion.flowId, versionId: flowVersion.id, versionName: nameInput.trim() || null })
    };

    const { mutate: viewVersion, isPending } = flowHooks.useFetchFlowVersion({
      onSuccess: (populatedFlowVersion) => {
        setVersion(populatedFlowVersion);
        setReadonly(
          populatedFlowVersion.state === FlowVersionState.LOCKED ||
            !userHasPermissionToWriteFlow,
        );
      },
    });

    const showAvatar = !useEmbedding().embedState.isEmbedded;

    return (
      <CardListItem interactive={false} className="px-4 group">
        {showAvatar && flowVersion.updatedByUser && (
          <UserAvatar
            size={45}
            withoutBorder={true}
            name={
              flowVersion.updatedByUser.firstName +
              ' ' +
              flowVersion.updatedByUser.lastName
            }
            email={flowVersion.updatedByUser.email}
          />
        )}
        <div className="grid gap-2">
          <FormattedDate
            date={new Date(flowVersion.created)}
            includeTime={true}
            className="text-sm font-medium leading-none select-none cursor-default"
          ></FormattedDate>
          {editingName ? (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                autoFocus
                className="h-6 text-xs px-1 py-0 w-36"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                placeholder={t('Version #{{n}}', { n: flowVersionNumber })}
              />
              <Button variant="ghost" size="icon" className="size-5 p-0" onClick={commitName}>
                <Check className="w-3 h-3 text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" className="size-5 p-0" onClick={() => setEditingName(false)}>
                <X className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <p
              className="flex gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => { setNameInput(flowVersion.versionName ?? ''); setEditingName(true); }}
              title={t('Click to rename')}
            >
              {flowVersion.versionName
                ? <span className="font-medium text-foreground">{flowVersion.versionName}</span>
                : <span>{t('Version')} #{flowVersionNumber}</span>
              }
              <Pencil className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-60" />
            </p>
          )}
        </div>
        <div className="grow"></div>
        <div className="flex font-medium gap-2 justify-center items-center">
          {selected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-10 flex justify-center items-center">
                  <EyeIcon className="w-5 h-5 "></EyeIcon>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t('Viewing')}</TooltipContent>
            </Tooltip>
          )}

          <FlowVersionStateDot
            state={flowVersion.state}
            versionId={flowVersion.id}
            publishedVersionId={publishedVersionId}
          ></FlowVersionStateDot>

          <DropdownMenu
            onOpenChange={(open) => setDropdownMenuOpen(open)}
            open={dropdownMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" disabled={isPending} size={'icon'}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuItem
                onClick={() => viewVersion(flowVersion)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>{t('View')}</span>
              </DropdownMenuItem>
              {flowVersion.state !== FlowVersionState.DRAFT && (
                <OverwriteDraftDialog
                  versionNumber={flowVersionNumber.toString()}
                  versionId={flowVersion.id}
                  onConfirm={() => {
                    setDropdownMenuOpen(false);
                  }}
                >
                  <DropdownMenuItem
                    className="w-full"
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    disabled={!userHasPermissionToWriteFlow}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>{t('Use as Draft')}</span>
                  </DropdownMenuItem>
                </OverwriteDraftDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardListItem>
    );
  },
);

FlowVersionDetailsCard.displayName = 'FlowVersionDetailsCard';
export { FlowVersionDetailsCard };

type FlowVersionDetailsCardProps = {
  flowVersion: FlowVersionMetadata;
  selected: boolean;
  publishedVersionId: string | undefined | null;
  flowVersionNumber: number;
};
