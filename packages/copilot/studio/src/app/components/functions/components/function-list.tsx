import { useState } from 'react';
import { Function, FunctionType } from '../types';

interface FunctionListProps {
  onFunctionSelect: (func: Function) => void;
}

export const FunctionList = ({ onFunctionSelect }: FunctionListProps) => {
  console.debug('Rendering FunctionList');
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableFunctions: Function[] = [
    {
      id: 'piece_search',
      name: 'Piece Search',
      description: 'Search for ActivePieces pieces and their functions',
      category: 'Core',
      type: FunctionType.PIECE_SEARCH,
      parameters: [
        {
          name: 'query',
          description: 'The search query to find relevant pieces',
          type: 'string',
          required: true
        }
      ]
    }
  ];

  const filteredFunctions = availableFunctions.filter(func => 
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="space-y-2 overflow-y-auto">
        {filteredFunctions.map(func => (
          <button
            key={func.id}
            onClick={() => onFunctionSelect(func)}
            className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
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