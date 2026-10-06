import dayjs from 'dayjs';

function monthRange({ month, now }: { month: string; now: Date }): HealthRange {
  const start = dayjs(`${month}-01`).startOf('month');
  const monthEnd = start.endOf('month');
  const todayEnd = dayjs(now).endOf('day');
  return {
    createdAfter: start.toISOString(),
    createdBefore: (monthEnd.isAfter(todayEnd)
      ? todayEnd
      : monthEnd
    ).toISOString(),
  };
}

export const healthRangeUtils = { monthRange };

export type HealthRange = {
  createdAfter: string;
  createdBefore: string;
};
