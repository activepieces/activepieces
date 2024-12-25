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


  const getThresholdColor = (value: number) => {
    if (value < 0.4) return 'text-red-600';
    if (value < 0.6) return 'text-yellow-600';
    if (value < 0.8) return 'text-blue-600';
    return 'text-green-600';
  };

  const gradientPercentage = threshold * 100;
  const sliderBackground = `linear-gradient(to right, rgb(37 99 235) ${gradientPercentage}%, rgb(229 231 235) ${gradientPercentage}%)`;

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Relevance</span>
          <div className={`text-xs font-medium ${getThresholdColor(threshold)} bg-gray-50 px-1.5 py-0.5 rounded-full`}>
            {Math.round(threshold * 100)}%
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          value={threshold * 100}
          onChange={handleChange}
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          style={{
            background: sliderBackground,
            WebkitAppearance: 'none',
          }}
        />
        <input
          type="number"
          min="0"
          max="100"
          value={Math.round(threshold * 100)}
          onChange={(e) => {
            const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) / 100;
            setThreshold(value);
            onChange(value);
          }}
          className="w-14 px-1 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}; 