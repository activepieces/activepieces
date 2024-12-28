import { useState } from 'react';
import { Function } from '../types';

interface FunctionTesterProps {
  selectedFunction: Function | null;
}

export const FunctionTester = ({ selectedFunction }: FunctionTesterProps) => {
  const [inputParams, setInputParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!selectedFunction) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Select a function to test</p>
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
      // TODO: Implement actual function testing logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      setResult(JSON.stringify({ success: true, data: inputParams }, null, 2));
    } catch (error) {
      setResult(JSON.stringify({ error: 'Function test failed' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-xl font-semibold">{selectedFunction.name}</h2>
        <p className="text-gray-600">{selectedFunction.description}</p>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-medium mb-2">Input Parameters</h3>
          {/* TODO: Replace with actual function parameters */}
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
            {isLoading ? 'Testing...' : 'Test Function'}
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