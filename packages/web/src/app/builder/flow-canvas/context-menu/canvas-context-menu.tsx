import { ShortcutProps } from '@/components/custom/shortcut';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';

import { CanvasContextMenuContent } from './canvas-context-menu-content';

export type CanvasShortcutsProps = Record<
  'Minimap' | 'Paste' | 'Delete' | 'Copy' | 'Skip' | 'ExitDrag',
  ShortcutProps
>;

export enum ContextMenuType {
  CANVAS = 'CANVAS',
  STEP = 'STEP',
}
export type CanvasContextMenuProps = {
  children?: React.ReactNode;
  contextMenuType: ContextMenuType;
};
export const CanvasContextMenu = ({
  contextMenuType,
  children,
}: CanvasContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <CanvasContextMenuContent
        contextMenuType={contextMenuType}
      ></CanvasContextMenuContent>
    </ContextMenu>
  );
};
