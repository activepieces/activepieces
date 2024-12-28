import { useState, useEffect } from 'react';
import { WebsocketCopilotCommand, WebsocketCopilotUpdate, PieceSearchResult } from '@activepieces/copilot-shared';
import { useWebSocketStore } from '../../../../stores/use-websocket-store';
import { websocketService } from '../../../../services/websocket-service';
import { PieceSearchTester } from '../testers/piece-search-tester';

export const PieceSearchHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PieceSearchResult[] | null>(null);
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

  const handleSearch = async (query: string) => {
    console.debug('Searching for pieces with query:', query);
    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const socket = websocketService.getSocket();
      
      if (!socket) {
        throw new Error('WebSocket connection not available');
      }

      socket.emit('message', {
        command: WebsocketCopilotCommand.SEARCH_PIECES,
        data: { query }
      });
      console.debug('Piece search request sent via WebSocket');
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search for pieces. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PieceSearchTester
      onSearch={handleSearch}
      isLoading={isLoading}
      results={searchResults}
      error={error}
    />
  );
}; 