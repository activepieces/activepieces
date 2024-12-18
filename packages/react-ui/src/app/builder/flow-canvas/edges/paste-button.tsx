import { ClipboardPaste } from 'lucide-react';

import {
  useBuilderStateContext,
  usePasteActionsInClipboard,
} from '../../builder-hooks';
import { pasteNodes } from '../bulk-actions';
import { ApButtonData } from '../utils/types';

// TODO: make the position of the paste button relative to the add button
export const PasteButton = ({
  addButtonData,
}: {
  addButtonData: ApButtonData;
}) => {
  const pasteActionsInClipboard = usePasteActionsInClipboard();
  const [flowVersion, applyOperation] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.applyOperation,
  ]);
  return (
    pasteActionsInClipboard.length > 0 && (
      <button
        className="bg-transparent text-primary w-5 h-5 flex items-center justify-center"
        onClick={() => {
          pasteNodes(
            pasteActionsInClipboard,
            flowVersion,
            addButtonData,
            applyOperation,
          );
        }}
      >
        <ClipboardPaste className="w-4 h-4 -scale-x-100" />
      </button>
    )
  );
};
