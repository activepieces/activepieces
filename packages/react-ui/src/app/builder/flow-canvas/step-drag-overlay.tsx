import { Action, Trigger } from '@activepieces/shared';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';


type StepDragTemplateProps = {
    step: Action | Trigger
};

const StepDragOverlay = ({ step }: StepDragTemplateProps) => {

    const data = piecesHooks.usePieceMetadata({
        step: step!,
      }).data;

  return (
    <div className="p-4 h-[100px] opacity-75 w-[100px] flex items-center justify-center rounded-lg border border-solid border bg-white relative">
        <img
          id="logo"
          className="object-contain left-0 right-0  static"
          src={data?.logoUrl}
          alt="Step Icon"
        />

    </div>
  );
};

export default StepDragOverlay;
