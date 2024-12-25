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
    if (value < 0.4) return 'text-red-500';
    if (value < 0.6) return 'text-yellow-500';
    if (value < 0.8) return 'text-blue-500';
    return 'text-green-500';
  };

  const gradientPercentage = threshold * 100;
  const sliderBackground = `linear-gradient(to right, rgb(59 130 246) ${gradientPercentage}%, rgb(229 231 235) ${gradientPercentage}%)`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-1.5">
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
            className="w-12 px-1 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
          <span className={`text-xs font-medium ${getThresholdColor(threshold)}`}>%</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Low match</span>
        <span>High match</span>
      </div>
    </div>
  );
}; 