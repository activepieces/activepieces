import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

import { BuilderState } from '../../builder-hooks';
import { ApButtonData } from '../utils/types';

import { CanvasContextMenuContent } from './canvas-context-menu-content';

export type CanvasContextMenuProps = Pick<
  BuilderState,
  | 'applyOperation'
  | 'selectedStep'
  | 'flowVersion'
  | 'exitStepSettings'
  | 'readonly'
  | 'selectedNodes'
> & {
  children?: React.ReactNode;
  pasteActionData: {
    addButtonData: ApButtonData | null;
    singleSelectedStepName: string | null;
  };
};
export const CanvasContextMenu = ({
  selectedNodes,
  applyOperation,
  selectedStep,
  flowVersion,
  pasteActionData,
  children,
  exitStepSettings,
  readonly,
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
          pasteActionData={pasteActionData}
        ></CanvasContextMenuContent>
      </ContextMenuContent>
    </ContextMenu>
  );
};
