import { useMutation } from '@tanstack/react-query';
import {
  ActivepiecesClientEventName,
  ActivepiecesClientMcpOAuthApproved,
  ActivepiecesClientMcpOAuthDenied,
  ActivepiecesClientShowMcpIframe,
} from 'ee-embed-sdk';
import { t } from 'i18next';
import { jwtDecode } from 'jwt-decode';
import { Lock, Plug, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';

import { memoryRouter } from '@/app/guards';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { parentWindow } from '@/lib/dom-utils';

import { PermissionItem } from '../mcp-authorize/permission-item';

const postMessageToParent = (
  event:
    | ActivepiecesClientShowMcpIframe
    | ActivepiecesClientMcpOAuthApproved
    | ActivepiecesClientMcpOAuthDenied,
) => {
  parentWindow.postMessage(event, '*');
};

export const EmbeddedMcpAuthorizeDialog = () => {
  const authRequestId = new URLSearchParams(
    memoryRouter.state.location.search,
  ).get('authRequestId');
  const clientName = decodeClientName(authRequestId);
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  useEffect(() => {
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_SHOW_MCP_IFRAME,
      data: {},
    });
    document.body.style.background = 'transparent';
  }, []);

  const approveMutation = useMutation({
    mutationFn: () => {
      const projectId = authenticationSession.getProjectId();
      return api.post<{ redirectUrl: string }>('/v1/mcp-oauth/approve', {
        authRequestId,
        ...(projectId && { projectId }),
      });
    },
    onSuccess: (data) => {
      setIsDialogOpen(false);
      postMessageToParent({
        type: ActivepiecesClientEventName.CLIENT_MCP_OAUTH_APPROVED,
        data: { redirectUrl: data.redirectUrl },
      });
    },
  });

  const deny = () => {
    setIsDialogOpen(false);
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_MCP_OAUTH_DENIED,
      data: {},
    });
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          deny();
        }
      }}
    >
      <DialogContent
        showOverlay={false}
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
        className="min-w-[400px] max-w-[440px]"
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t('Authorize Application')}
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-semibold text-foreground">{clientName}</span>{' '}
            {t('wants to connect to your Activepieces account')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <PermissionItem
            icon={<Workflow className="h-4 w-4 text-primary" />}
            text={t('Build, test, and manage automations')}
          />
          <PermissionItem
            icon={<Lock className="h-4 w-4 text-primary" />}
            text={t('Use connections and execute flows')}
          />
        </div>

        <Separator />

        {approveMutation.isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive-100 p-3 text-sm text-destructive">
            {t('Authorization failed. Please try again.')}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={deny}
          >
            {t('Deny')}
          </Button>
          <Button
            type="button"
            className="flex-1"
            loading={approveMutation.isPending}
            disabled={!authRequestId}
            onClick={() => approveMutation.mutate()}
          >
            {t('Authorize')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function decodeClientName(token: string | null): string {
  try {
    if (!token) return t('Unknown app');
    return (
      jwtDecode<{ clientName?: string }>(token).clientName ?? t('Unknown app')
    );
  } catch {
    return t('Unknown app');
  }
}
