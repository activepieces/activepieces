import { useState, useEffect } from 'react';
import { WebsocketCopilotCommand, WebsocketCopilotUpdate, PieceSearchResult } from '@activepieces/copilot-shared';
import { useWebSocketStore } from '../../../../stores/use-websocket-store';
import { websocketService } from '../../../../services/websocket-service';
import { PieceSearchTester } from '../testers/piece-search-tester';

export const PieceSearchHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PieceSearchResult[] | null>(null);
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const results = useWebSocketStore((state) => state.results);

  useEffect(() => {
    // Listen for search results in the WebSocket store
    const latestResult = results[results.length - 1];
    if (latestResult?.type === WebsocketCopilotUpdate.PIECES_FOUND) {

      // Store raw response
      setRawResponse(latestResult);

      // Process and store formatted results
      const pieces = latestResult.data.relevantPieces.map((piece: PieceSearchResult) => ({
        pieceName: piece.pieceName,
        content: piece.content,
        logoUrl: piece.logoUrl || '',
        relevanceScore: piece.relevanceScore
      }));
      setSearchResults(pieces);
      setIsLoading(false);
    }
  }, [results]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    setRawResponse(null);

    try {
      const socket = websocketService.getSocket();
      
      if (!socket) {
        throw new Error('WebSocket connection not available');
      }

      socket.emit('message', {
        command: WebsocketCopilotCommand.SEARCH_PIECES,
        data: { query }
      });
    } catch (err) {
      setError('Failed to search for pieces. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PieceSearchTester
      onSearch={handleSearch}
      isLoading={isLoading}
      results={searchResults}
      rawResponse={rawResponse}
      error={error}
    />
  );
}; 