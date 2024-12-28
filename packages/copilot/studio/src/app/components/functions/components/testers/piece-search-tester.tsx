import { useState, useEffect } from 'react';
import { WebsocketCopilotCommand, WebsocketCopilotUpdate, PieceSearchResult } from '@activepieces/copilot-shared';
import { useWebSocketStore } from '../../../../stores/use-websocket-store';
import { websocketService } from '../../../../services/websocket-service';

interface PieceSearchTesterProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  results: PieceSearchResult[] | null;
  error: string | null;
}

export const PieceSearchTester = ({ onSearch, isLoading, results, error }: PieceSearchTesterProps) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    onSearch(query);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Search Query<span className="text-red-500 ml-1">*</span>
          </label>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            string
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Enter a search query to find relevant pieces</p>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query"
            className="block w-full rounded-md border-0 py-2.5 px-3 bg-gray-50 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isLoading || !query.trim()}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </span>
        ) : (
          'Search Pieces'
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900">Results</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {results.map((piece, index) => (
              <div
                key={`${piece.pieceName}-${index}`}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {piece.logoUrl && (
                    <img
                      src={piece.logoUrl}
                      alt={piece.pieceName}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{piece.pieceName}</h4>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{piece.content}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-shrink-0 rounded-full h-2 w-2 bg-green-400"></div>
                      <span className="text-xs text-gray-500">
                        Relevance: {(piece.relevanceScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 