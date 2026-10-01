import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Cable,
  Crown,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash,
} from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { platformAppConnectionsMutations } from '@/features/platform-admin';
import { projectConnectionsPath } from '@/lib/route-utils';

export const ConnectionRowActions = ({
  connection,
  globalLocked,
  onOpenDialog,
  onLockedAction,
}: ConnectionRowActionsProps) => {
  const chosen = useRef<ConnectionRowAction | null>(null);
  const navigate = useNavigate();
  const { mutate: revalidate } =
    platformAppConnectionsMutations.useRevalidate();
  const isGlobal = connection.scope === AppConnectionScope.PLATFORM;
  const locked = isGlobal && globalLocked;
  const [ownProject] = isGlobal ? [] : connection.projects;
  const cannotReconnect = !locked && connection.projects.length === 0;
  const choose = (action: ConnectionRowAction) => () => {
    chosen.current = action;
  };
  const icon = (unlocked: React.ReactNode) =>
    locked ? (
      <>
        <Crown className="size-4 text-accent-11" />
        <span className="sr-only">{t('Upgrade to unlock')}</span>
      </>
    ) : (
      unlocked
    );

  const run = (action: ConnectionRowAction) => {
    switch (action) {
      case 'test':
        revalidate(connection);
        return;
      case 'open-project':
        if (ownProject) {
          navigate(projectConnectionsPath(ownProject.id));
        }
        return;
      default:
        if (locked) {
          onLockedAction();
          return;
        }
        onOpenDialog({ kind: action, connection });
    }
  };

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t('Connection actions')}
            data-connection-actions={connection.id}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={() => {
            const action = chosen.current;
            chosen.current = null;
            if (action) {
              run(action);
            }
          }}
        >
          {isGlobal && (
            <>
              <DropdownMenuItem onSelect={choose('edit')}>
                {icon(<Pencil className="size-4" />)}
                {t('Edit access')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={cannotReconnect}
                onSelect={choose('reconnect')}
              >
                {icon(<Cable className="size-4" />)}
                {cannotReconnect
                  ? t('Reconnect (grant a project first)')
                  : t('Reconnect')}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onSelect={choose('test')}>
            <RefreshCw className="size-4" />
            {t('Test connection')}
          </DropdownMenuItem>
          {ownProject && (
            <DropdownMenuItem onSelect={choose('open-project')}>
              <FolderOpen className="size-4" />
              {t('Open project')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={locked ? undefined : 'destructive'}
            onSelect={choose('delete')}
          >
            {icon(<Trash className="size-4" />)}
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

type ConnectionRowAction =
  | 'edit'
  | 'reconnect'
  | 'test'
  | 'open-project'
  | 'delete';

export type RowDialog = {
  kind: 'edit' | 'reconnect' | 'delete';
  connection: PlatformAppConnectionsListItem;
};

type ConnectionRowActionsProps = {
  connection: PlatformAppConnectionsListItem;
  globalLocked: boolean;
  onOpenDialog: (dialog: RowDialog) => void;
  onLockedAction: () => void;
};
