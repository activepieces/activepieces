import { GearIcon } from '@radix-ui/react-icons';

import { CardListItem } from '@/components/ui/card-list';
import { FlowOperationType } from '@activepieces/shared';

import {
  StepMetadata,
  StepMetadataWithSuggestions,
  ItemListMetadata,
  PieceSelectorOperation,
} from '../lib/types';

type HandleSelectCallback = (
  piece: StepMetadata | undefined,
  item: ItemListMetadata,
) => void;

type PieceOperationSuggestionsProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  handleSelectOperationSuggestion: HandleSelectCallback;
  operation: PieceSelectorOperation;
};

const PieceOperationSuggestions = ({
  pieceMetadata,
  handleSelectOperationSuggestion,
  operation,
}: PieceOperationSuggestionsProps) => {
  const suggestions =
    operation.type === FlowOperationType.UPDATE_TRIGGER
      ? pieceMetadata.suggestedTriggers
      : pieceMetadata.suggestedActions;

  return (
    <>
      <div className="mt-0.5" />
      {suggestions?.map((suggestion) => (
        <CardListItem
          className="p-2 px-0 text-sm gap-2 items-start transition-transform duration-200 ease-in-out hover:scale-105 hover:font-bold"
          key={suggestion.name}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectOperationSuggestion(pieceMetadata, suggestion);
          }}
        >
          <GearIcon className="w-2 mt-0.5" />
          <span className="truncate" title={suggestion.displayName}>
            {suggestion.displayName}
          </span>
        </CardListItem>
      ))}
    </>
  );
};

export { PieceOperationSuggestions };
