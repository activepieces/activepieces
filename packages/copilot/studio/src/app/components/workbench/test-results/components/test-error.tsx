import { TestErrorData } from './types';

interface TestErrorProps {
  data: TestErrorData;
}

export const TestError: React.FC<TestErrorProps> = ({ data }) => {
  return (
    <div className="text-sm text-red-600">Error: {data.error}</div>
  );
}; 