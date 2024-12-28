import { StepCreatedData } from './types';

interface StepCreatedProps {
  data: StepCreatedData;
}

export const StepCreated: React.FC<StepCreatedProps> = ({ data }) => {

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Created Step:</div>
      <div className="bg-white p-2 rounded border border-gray-200">
        <div className="font-medium text-sm">{data.step.name}</div>
        <div className="text-xs mt-1">
          <span className="text-gray-600">Type: </span>
          <span className="font-medium">{data.step.type}</span>
        </div>
        {data.step.piece && (
          <div className="text-xs mt-1">
            <span className="text-gray-600">Piece: </span>
            <span className="font-medium">
              {data.step.piece.pieceName}
            </span>
            {(data.step.piece.actionName ||
              data.step.piece.triggerName) && (
                <span className="text-gray-600">
                  {' '}
                  (
                  {data.step.piece.actionName ||
                    data.step.piece.triggerName}
                  )
                </span>
              )}
          </div>
        )}
        {data.step.input && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">
              Input Configuration:
            </div>
            <pre className="text-xs bg-gray-50 p-1.5 rounded">
              {JSON.stringify(data.step.input, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}; 