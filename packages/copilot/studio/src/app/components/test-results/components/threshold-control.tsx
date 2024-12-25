import { useState } from "react";

interface ThresholdControlProps {
  defaultValue?: number;
  onChange: (value: number) => void;
}

export const ThresholdControl: React.FC<ThresholdControlProps> = ({ defaultValue = 0.35, onChange }) => {
  const [threshold, setThreshold] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100;
    setThreshold(value);
    onChange(value);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex-shrink-0">
        <div className="text-sm font-medium text-gray-700">Relevance Threshold</div>
        <div className="text-xs text-gray-500">Minimum similarity score for pieces</div>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={threshold * 100}
          onChange={handleChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex-shrink-0 w-16 text-center">
          <span className="text-sm font-medium text-gray-900">{Math.round(threshold * 100)}%</span>
        </div>
      </div>
    </div>
  );
}; 