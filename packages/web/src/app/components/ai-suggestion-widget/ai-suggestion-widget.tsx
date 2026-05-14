import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authenticationSession } from '@/lib/authentication-session';
import './ai-suggestion-widget.css';

interface APActionMeta {
  name: string;
  displayName: string;
}

interface APPieceMeta {
  name: string;
  displayName: string;
  actions: APActionMeta[];
}

interface ActionSuggestion {
  pieceName: string;
  actionName: string;
  confidence: number;
  suggestedParameters: Record<string, unknown>;
  reasoning: string;
}

interface AISuggestionWidgetProps {
  pieces: APPieceMeta[];
  onSelectSuggestion: (pieceName: string, actionName: string, parameters: Record<string, unknown>) => void;
  apiEndpoint?: string;
}

export const AISuggestionWidget: React.FC<AISuggestionWidgetProps> = ({
  pieces,
  onSelectSuggestion,
  apiEndpoint = '/api/v1/ai-suggestions/suggest'
}) => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const widgetRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<Array<HTMLDivElement | null>>([]);


  const fetchSuggestions = useCallback(async (searchQuery: string, signal?: AbortSignal) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveIndex(-1);

    try {
      const token = authenticationSession.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          query: searchQuery,
          workloadContext: { existingPieces: [] }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      const rawSuggestions: ActionSuggestion[] = data.suggestions || [];
      
      // Resolve P1 (Frontend): Validate that suggested actionName actually exists in the pieces meta
      const validatedSuggestions = rawSuggestions.filter(suggestion => {
        const piece = pieces.find(p => p.name === suggestion.pieceName);
        return piece?.actions.some(a => a.name === suggestion.actionName);
      });

      setSuggestions(validatedSuggestions);
      setActiveIndex(validatedSuggestions.length > 0 ? 0 : -1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error('Failed to fetch suggestions:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to get suggestions');
      }
      setSuggestions([]);
      setActiveIndex(-1);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [apiEndpoint, pieces]);

  useEffect(() => {
    const abortController = new AbortController();
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query, abortController.signal);
      } else {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [query, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: ActionSuggestion) => {
    onSelectSuggestion(
      suggestion.pieceName,
      suggestion.actionName,
      suggestion.suggestedParameters || {}
    );
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => {
        const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
        if (suggestionRefs.current[newIndex]) {
          suggestionRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' });
        }
        return newIndex;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
        if (suggestionRefs.current[newIndex]) {
          suggestionRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' });
        }
        return newIndex;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSuggestionClick(suggestions[activeIndex]);
      }
      return;
    }

    if (e.key === 'Tab') {
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }
  };

  return (
    <div className="ai-suggestion-widget" ref={widgetRef}>
      <div className="ai-suggestion-input-container">
        <input
          type="text"
          className="ai-suggestion-input"
          placeholder="Describe what you want to automate... (e.g., 'send email when new form submitted')"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          autoComplete="off"
          maxLength={500}
          aria-autocomplete="list"
          aria-controls="ai-suggestions-list"
          aria-expanded={showSuggestions && (suggestions.length > 0 || !!error)}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        />
        {isLoading && <div className="ai-suggestion-spinner" aria-label="Loading suggestions" />}
      </div>

      {showSuggestions && (suggestions.length > 0 || error) && (
        <div className="ai-suggestion-dropdown" id="ai-suggestions-list" role="listbox">
          {error ? (
            <div className="ai-suggestion-error" role="alert">{error}</div>
          ) : (
            suggestions.map((suggestion, idx) => {
              const piece = pieces.find(p => p.name === suggestion.pieceName);
              const action = piece?.actions.find(a => a.name === suggestion.actionName);

              return (
                <div
                  key={`${suggestion.pieceName}-${suggestion.actionName}-${idx}`}
                  id={`suggestion-${idx}`}
                  ref={el => { suggestionRefs.current[idx] = el; }}
                  className={`ai-suggestion-item ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  role="option"
                  aria-selected={idx === activeIndex}
                  tabIndex={-1}
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
