import { Function, FunctionType } from '../types';
import { PieceSearchHandler } from './handlers/piece-search-handler';

interface FunctionTesterProps {
  selectedFunction: Function | null;
}

export const FunctionTester = ({ selectedFunction }: FunctionTesterProps) => {

  if (!selectedFunction) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Select a function to test</p>
      </div>
    );
  }

  const renderFunctionHandler = () => {
    switch (selectedFunction.type) {
      case FunctionType.PIECE_SEARCH:
        return <PieceSearchHandler />;
      default:
        return (
          <div className="text-gray-500">
            No tester available for this function type: {selectedFunction.type}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Function Header */}
      <div className="border-b border-gray-200 pb-4 mb-6 px-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">{selectedFunction.name}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{selectedFunction.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedFunction.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Function Content */}
      <div className="flex-1 overflow-auto px-6">
        <div className="max-w-4xl mx-auto w-full">
          {renderFunctionHandler()}
        </div>
      </div>
    </div>
  );
}; 