import { PiecesFoundData } from "@activepieces/copilot-shared";

interface PiecesFoundProps {
  data: PiecesFoundData;
}

export const PiecesFound: React.FC<PiecesFoundProps> = ({ data }) => {
  console.debug('Rendering PiecesFound component with data:', data);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-sm font-medium text-gray-700">Found Relevant Pieces</div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {data.relevantPieces.length} pieces
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.relevantPieces.map(
          (piece: { pieceName: string; content: string; logoUrl?: string }, i: number) => (
            <div
              key={i}
              className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center overflow-hidden">
                    {piece.logoUrl ? (
                      <img 
                        src={piece.logoUrl} 
                        alt={`${piece.pieceName} logo`} 
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          console.debug(`Failed to load logo for ${piece.pieceName}:`, e);
                          e.currentTarget.style.display = 'none';
                          // Show first letter of piece name as fallback
                          e.currentTarget.parentElement!.innerHTML = piece.pieceName.charAt(0).toUpperCase();
                        }}
                      />
                    ) : (
                      <span className="text-sm font-medium text-purple-700">
                        {piece.pieceName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {piece.pieceName}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 hover:line-clamp-none transition-all duration-200">
                  {piece.content}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg ring-2 ring-transparent hover:ring-purple-400 focus:ring-purple-500 transition-all duration-200" />
            </div>
          )
        )}
      </div>
    </div>
  );
}; 