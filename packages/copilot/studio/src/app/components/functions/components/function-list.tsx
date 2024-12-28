import { useState } from 'react';

interface Function {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface FunctionListProps {
  onFunctionSelect: (func: Function) => void;
}

export const FunctionList = ({ onFunctionSelect }: FunctionListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // TODO: Replace with actual functions from ActivePieces
  const mockFunctions: Function[] = [
    {
      id: '1',
      name: 'HTTP Request',
      description: 'Make HTTP requests to external APIs',
      category: 'Core'
    },
    {
      id: '2',
      name: 'File Operations',
      description: 'Read and write files',
      category: 'Core'
    }
  ];

  const filteredFunctions = mockFunctions.filter(func => 
    func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    func.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search functions..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="space-y-2 overflow-y-auto">
        {filteredFunctions.map(func => (
          <button
            key={func.id}
            onClick={() => onFunctionSelect(func)}
            className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors"
          >
            <h3 className="font-medium">{func.name}</h3>
            <p className="text-sm text-gray-500">{func.description}</p>
            <span className="text-xs text-gray-400">{func.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 