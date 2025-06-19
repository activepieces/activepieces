import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ShortcutProps } from '@/components/ui/shortcut';

import { BuilderState } from '../../builder-hooks';

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
export type CanvasContextMenuProps = Pick<
  BuilderState,
  | 'applyOperation'
  | 'selectedStep'
  | 'flowVersion'
  | 'exitStepSettings'
  | 'readonly'
  | 'selectedNodes'
  | 'setPieceSelectorStep'
> & {
  children?: React.ReactNode;
  contextMenuType: ContextMenuType;
};
export const CanvasContextMenu = ({
  selectedNodes,
  applyOperation,
  selectedStep,
  flowVersion,
  children,
  exitStepSettings,
  readonly,
  setPieceSelectorStep,
  contextMenuType,
}: CanvasContextMenuProps) => {
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <CanvasContextMenuContent
          selectedNodes={selectedNodes}
          applyOperation={applyOperation}
          selectedStep={selectedStep}
          flowVersion={flowVersion}
          exitStepSettings={exitStepSettings}
          readonly={readonly}
          setPieceSelectorStep={setPieceSelectorStep}
          contextMenuType={contextMenuType}
        ></CanvasContextMenuContent>
      </ContextMenuContent>
    </ContextMenu>
  );
};
