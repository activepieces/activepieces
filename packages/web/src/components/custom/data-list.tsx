import React from 'react';

type DataListProps = {
  data?: Record<string, any>;
  className?: string;
};

function formatValue(value: any): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export const DataList: React.FC<DataListProps> = ({
  data = {},
  className = '',
}) => {
  const entries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined,
  );

  if (entries.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground italic ${className}`}>
        No data available
      </div>
    );
  }

  return (
    <dl
      className={`grid gap-y-2 text-sm leading-relaxed ${className}`}
      style={{ wordBreak: 'break-word' }}
    >
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-[auto_1fr] gap-x-3 items-start"
        >
          <dt className="font-medium text-muted-foreground capitalize">
            {key}
          </dt>
          <dd className="text-primary">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
};
