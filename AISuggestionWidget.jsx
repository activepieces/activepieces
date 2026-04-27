import React, { useState, useEffect, useCallback } from 'react';
import './AISuggestionWidget.css';

interface AISuggestionWidgetProps {
  pieces: Array<{ name: string; displayName: string; actions: Array<{ name: string; displayName: string }> }>;
  onSelectSuggestion: (pieceName: string, actionName: string, parameters: Record<string, any>) => void;
  apiEndpoint?: string;
}

export const AISuggestionWidget: React.FC<AISuggestionWidgetProps> = ({
  pieces,
  onSelectSuggestion,
  apiEndpoint = '/api/ai/suggest'
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const existingPieceNames = pieces.map(p => p.name);
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          workloadContext: { existingPieces: existingPieceNames }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error('Failed to fetch suggestions:', err);
      setError(err.message || 'Failed to get suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, pieces]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: any) => {
    onSelectSuggestion(
      suggestion.pieceName,
      suggestion.actionName,
      suggestion.suggestedParameters || {}
    );
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="ai-suggestion-widget">
      <div className="ai-suggestion-input-container">
        <input
          type="text"
          className="ai-suggestion-input"
          placeholder="Describe what you want to automate... (e.g., 'send email when new form submitted')"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        />
        {isLoading && <div className="ai-suggestion-spinner" />}
      </div>

      {showSuggestions && (suggestions.length > 0 || error) && (
        <div className="ai-suggestion-dropdown">
          {error ? (
            <div className="ai-suggestion-error">{error}</div>
          ) : (
            suggestions.map((suggestion, idx) => {
              const piece = pieces.find(p => p.name === suggestion.pieceName);
              const action = piece?.actions.find(a => a.name === suggestion.actionName);
              
              return (
                <div
                  key={`${suggestion.pieceName}-${suggestion.actionName}-${idx}`}
                  className="ai-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="ai-suggestion-header">
                    <span className="ai-suggestion-piece">
                      {piece?.displayName || suggestion.pieceName}
                    </span>
                    <span className="ai-suggestion-action">
                      {action?.displayName || suggestion.actionName}
                    </span>
                    <span className={`ai-suggestion-confidence ${getConfidenceClass(suggestion.confidence)}`}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <div className="ai-suggestion-reasoning">
                    {suggestion.reasoning}
                  </div>
                  {Object.keys(suggestion.suggestedParameters || {}).length > 0 && (
                    <div className="ai-suggestion-parameters">
                      {Object.entries(suggestion.suggestedParameters).map(([key, value]) => (
                        <span key={key} className="ai-suggestion-parameter">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}
// === END ===