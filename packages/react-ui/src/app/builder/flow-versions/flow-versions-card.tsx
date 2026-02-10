import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Eye, EyeIcon, Pencil } from 'lucide-react';
import React, { useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { CardListItem } from '@/components/custom/card-list';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  FlowVersionMetadata,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';

import { OverwriteDraftDialog } from './overwrite-draft-dialog';

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
      <CardListItem interactive={false} className="px-4">
        {showAvatar && flowVersion.updatedByUser && (
          <UserAvatar
            size={28}
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
          <p className="flex gap-1 text-xs text-muted-foreground">
            {t('Version')} #{flowVersionNumber}
          </p>
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
                <DotsVerticalIcon />
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
