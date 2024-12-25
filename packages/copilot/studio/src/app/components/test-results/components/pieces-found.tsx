import { PiecesFoundData } from "@activepieces/copilot-shared";

interface PiecesFoundProps {
  data: PiecesFoundData;
}

export const PiecesFound: React.FC<PiecesFoundProps> = ({ data }) => {
  console.debug('Rendering PiecesFound component with data:', data);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Found Relevant Pieces:</div>
      <div className="flex flex-wrap gap-2">
        {data.relevantPieces.map(
          (piece: { pieceName: string; content: string }, i: number) => (
            <div
              key={i}
              className="group relative"
              tabIndex={0}
              role="button"
              aria-label={`View details for ${piece.pieceName}`}
            >
              <div className="bg-purple-50 hover:bg-purple-100 focus:bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 text-xs font-medium text-purple-700 cursor-pointer transition-colors duration-150 outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                {piece.pieceName}
              </div>
              
              {/* Tooltip */}
              <div className="invisible group-hover:visible group-focus:visible opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-64 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="text-xs text-gray-600 whitespace-pre-wrap">
                  {piece.content}
                </div>
                {/* Arrow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-t border-l border-gray-200"></div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}; 