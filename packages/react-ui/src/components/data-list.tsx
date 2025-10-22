import React from 'react';

type DataListProps = {
  data: Record<string, any>;
  className?: string;
};

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export const DataList: React.FC<DataListProps> = ({ data, className = '' }) => {
  const entries = Object.entries(data ?? {})
    .map(([key, value]) => [key, formatValue(value)])
    .filter(([_, value]) => value !== '');

  return (
    <div
      className={`relative rounded-lg bg-background py-4 w-full ${className}`}
      style={{ minWidth: 0, width: '100%' }}
    >
      <dl className="space-y-2 w-full">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 w-full">
            <dt className="text-sm font-semibold flex-shrink-0 self-start">
              {key}:
            </dt>
            <dd className="text-sm break-words text-primary flex-1">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
