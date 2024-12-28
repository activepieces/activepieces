import { useState, useEffect } from 'react';
import { PieceSearchResult, WebsocketCopilotCommand, WebsocketCopilotUpdate, WebsocketEventTypes } from '@activepieces/copilot-shared';
import { useWebSocketStore } from '../../../stores/use-websocket-store';
import { websocketService } from '../../../services/websocket-service';

interface PieceSearchProps {
  onPieceSelect: (piece: PieceSearchResult) => void;
}

export const PieceSearch = ({ onPieceSelect }: PieceSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PieceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const results = useWebSocketStore((state) => state.results);

  useEffect(() => {
    // Listen for search results in the WebSocket store
    const latestResult = results[results.length - 1];
    console.debug('Latest WebSocket result:', latestResult);
    if (latestResult?.type === WebsocketCopilotUpdate.PIECES_FOUND) {
      console.debug('Received PIECES_FOUND event:', latestResult);
      const pieces = latestResult.data.relevantPieces.map(piece => ({
        pieceName: piece.pieceName,
        content: piece.content,
        logoUrl: piece.logoUrl || '',
        relevanceScore: piece.relevanceScore
      }));
      console.debug('Processed pieces:', pieces);
      setSearchResults(pieces);
      setIsLoading(false);
    }
  }, [results]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchResults([]); // Clear previous results

    try {
      console.debug('Initiating piece search with query:', searchQuery);
      const socket = websocketService.getSocket();
      
      if (!socket) {
        throw new Error('WebSocket connection not available');
      }

      socket.emit('message', {
        command: WebsocketCopilotCommand.SEARCH_PIECES,
        data: {
          query: searchQuery
        }
      });
      console.debug('Search request sent via WebSocket');
    } catch (err) {
      console.error('Error searching for pieces:', err);
      setError('Failed to search for pieces. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for pieces..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2 overflow-y-auto">
        {searchResults.map((piece, index) => (
          <button
            key={`${piece.pieceName}-${index}`}
            onClick={() => onPieceSelect(piece)}
            className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          >
            <div className="flex items-center gap-3">
              {piece.logoUrl && (
                <img
                  src={piece.logoUrl}
                  alt={piece.pieceName}
                  className="w-8 h-8 rounded-md"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{piece.pieceName}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{piece.content}</p>
                <span className="text-xs text-gray-400">
                  Relevance: {(piece.relevanceScore * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 