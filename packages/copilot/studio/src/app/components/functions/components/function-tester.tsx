import { PieceSearchResult } from '@activepieces/copilot-shared';
import { useState } from 'react';

interface Function {
  id: string;
  name: string;
  description: string;
  category: string;
}


interface FunctionTesterProps {
  selectedFunction: Function | null;
  selectedPiece: PieceSearchResult | null;
}

export const FunctionTester = ({ selectedFunction, selectedPiece }: FunctionTesterProps) => {
  const [inputParams, setInputParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!selectedFunction && !selectedPiece) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Select a function or piece to test</p>
      </div>
    );
  }

  const handleParamChange = (paramName: string, value: string) => {
    setInputParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // TODO: Implement actual function/piece testing logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      
      if (selectedPiece) {
        console.log('Testing piece:', selectedPiece.pieceName);
        setResult(JSON.stringify({
          success: true,
          piece: selectedPiece.pieceName,
          params: inputParams
        }, null, 2));
      } else if (selectedFunction) {
        console.log('Testing function:', selectedFunction.name);
        setResult(JSON.stringify({
          success: true,
          function: selectedFunction.name,
          params: inputParams
        }, null, 2));
      }
    } catch (error) {
      console.error('Test failed:', error);
      setResult(JSON.stringify({ error: 'Test failed' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = selectedPiece ? selectedPiece.pieceName : selectedFunction?.name;
  const displayDescription = selectedPiece ? selectedPiece.content : selectedFunction?.description;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          {selectedPiece?.logoUrl && (
            <img
              src={selectedPiece.logoUrl}
              alt={selectedPiece.pieceName}
              className="w-8 h-8 rounded-md"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-gray-600">{displayDescription}</p>
            {selectedPiece && (
              <span className="text-sm text-gray-400">
                Relevance: {(selectedPiece.relevanceScore * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-medium mb-2">Input Parameters</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parameter 1
              </label>
              <input
                type="text"
                value={inputParams['param1'] || ''}
                onChange={(e) => handleParamChange('param1', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test'}
          </button>
        </div>

        {result && (
          <div>
            <h3 className="font-medium mb-2">Result</h3>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}; 