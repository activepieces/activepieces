import { Route, Routes, Link } from 'react-router-dom';
import { TestResults } from './_components/test-results';

export function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Copilot Studio</h1>
            
            <nav className="mb-8">
              <ul className="flex space-x-6">
                <li>
                  <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
                </li>
                <li>
                  <Link to="/tests" className="text-blue-600 hover:text-blue-800">Test Results</Link>
                </li>
              </ul>
            </nav>

            <Routes>
              <Route
                path="/"
                element={
                  <div className="text-center py-12">
                    <h2 className="text-2xl mb-4">Welcome to Copilot Studio</h2>
                    <p className="text-gray-600">
                      View real-time test results by navigating to the Test Results page.
                    </p>
                  </div>
                }
              />
              <Route
                path="/tests"
                element={<TestResults />}
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
