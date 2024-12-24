import { TestResults } from './_components/test-results';
import { Scenarios } from './_components/scenarios';

export function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-screen">
        <div className="h-full">
          <div className="h-full p-6">
            <h1 className="text-3xl font-bold mb-6">Copilot Studio</h1>
            
            <div className="grid grid-cols-2 gap-6 h-[calc(100%-5rem)]">
              {/* Left Column */}
              <div className="space-y-6 h-full">
                {/* Top Left Square - Scenarios */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-1/2">
                  <Scenarios />
                </div>
                {/* Bottom Left Square - Future Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-1/2">
                  <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
                  <p className="text-gray-600">Future content will be added here.</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6 h-full">
                {/* Top Right Square - Test Results */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-1/2">
                  <TestResults />
                </div>
                {/* Bottom Right Square - Future Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-1/2">
                  <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
                  <p className="text-gray-600">Future content will be added here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
