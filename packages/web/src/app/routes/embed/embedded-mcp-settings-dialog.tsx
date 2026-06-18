import {
  ActivepiecesClientEventName,
  ActivepiecesClientMcpSettingsDialogClosed,
  ActivepiecesClientShowMcpIframe,
} from 'ee-embed-sdk';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { parentWindow } from '@/lib/dom-utils';

import { McpServerSettings } from '../../components/project-settings/mcp-server';

const postMessageToParent = (
  event:
    | ActivepiecesClientShowMcpIframe
    | ActivepiecesClientMcpSettingsDialogClosed,
) => {
  parentWindow.postMessage(event, '*');
};

export const EmbeddedMcpSettingsDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  useEffect(() => {
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_SHOW_MCP_IFRAME,
      data: {},
    });
    document.body.style.background = 'transparent';
  }, []);

  const closeDialog = () => {
    setIsDialogOpen(false);
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_MCP_SETTINGS_DIALOG_CLOSED,
      data: {},
    });
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
    >
      <DialogContent
        showOverlay={false}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-h-[80vh] min-w-[450px] max-w-[450px] lg:min-w-[700px] lg:max-w-[700px] overflow-y-auto"
      >
        <McpServerSettings />
      </DialogContent>
    </Dialog>
  );
};
