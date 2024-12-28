import { useState } from 'react';
import { Function, FunctionType } from '../types';

interface FunctionListProps {
  onFunctionSelect: (func: Function) => void;
}

export const FunctionList = ({ onFunctionSelect }: FunctionListProps) => {
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
    func.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 px-1">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search functions..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1">
        <div className="space-y-1">
          {filteredFunctions.map(func => (
            <button
              key={func.id}
              onClick={() => onFunctionSelect(func)}
              className="w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{func.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {func.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 