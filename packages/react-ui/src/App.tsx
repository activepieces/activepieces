import React, { useState } from 'react';

function App(): JSX.Element {
  const [count, setCount] = useState<number>(0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Welcome to Activepieces UI
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <p className="text-lg text-gray-700 mb-6">
            This is a test component to verify the setup.
          </p>
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Count is: {count}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Edit <code className="bg-gray-100 px-1 rounded">src/App.tsx</code> to see changes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
