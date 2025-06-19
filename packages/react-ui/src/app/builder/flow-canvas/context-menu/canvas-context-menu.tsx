import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ShortcutProps } from '@/components/ui/shortcut';

import { CanvasContextMenuContent } from './canvas-context-menu-content';

export type CanvasShortcutsProps = Record<
  'Paste' | 'Delete' | 'Copy' | 'Skip',
  ShortcutProps
>;
export const CanvasShortcuts: CanvasShortcutsProps = {
  Paste: {
    withCtrl: true,
    withShift: false,
    shortcutKey: 'v',
  },
  Delete: {
    withCtrl: false,
    withShift: true,
    shortcutKey: 'Delete',
  },
  Copy: {
    withCtrl: true,
    withShift: false,
    shortcutKey: 'c',
    shouldNotPreventDefault: true,
  },
  Skip: {
    withCtrl: true,
    withShift: false,
    shortcutKey: 'e',
  },
};
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
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <CanvasContextMenuContent
          contextMenuType={contextMenuType}
        ></CanvasContextMenuContent>
      </ContextMenuContent>
    </ContextMenu>
  );
};
