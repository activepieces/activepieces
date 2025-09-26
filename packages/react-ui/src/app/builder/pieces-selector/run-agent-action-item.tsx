import { PieceSelectorOperation, PieceSelectorPieceItem } from '@/lib/types';
import CreateAgentActionItem from './create-agent-action-item';

type RunAgentActionItemProps = {
  pieceSelectorItem: PieceSelectorPieceItem;
  operation: PieceSelectorOperation;
  hidePieceIconAndDescription: boolean;
};

const RunAgentActionItem = ({
  pieceSelectorItem,
  operation,
  hidePieceIconAndDescription,
}: RunAgentActionItemProps) => {

  return (
    <CreateAgentActionItem
      pieceSelectorItem={pieceSelectorItem}
      operation={operation}
      hidePieceIconAndDescription={hidePieceIconAndDescription}
    />
  );
};

export default RunAgentActionItem;
