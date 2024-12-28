import { useState } from 'react';
import { FunctionList } from './components/function-list';
import { FunctionTester } from './components/function-tester';
import { Function } from './types';

export const Functions = () => {
  console.debug('Rendering Functions');
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null);

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 px-4 py-2">
        <h1 className="text-xl font-semibold">ActivePieces Functions</h1>
      </div>
      <div className="flex-1 flex">
        {/* Left panel for function list */}
        <div className="w-1/4 border-r border-gray-200 p-4">
          <FunctionList onFunctionSelect={setSelectedFunction} />
        </div>
        
        {/* Right panel for function testing */}
        <div className="flex-1 p-4">
          <FunctionTester selectedFunction={selectedFunction} />
        </div>
      </div>
    </div>
  );
}; 