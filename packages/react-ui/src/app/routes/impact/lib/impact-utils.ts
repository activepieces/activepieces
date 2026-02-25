import { toPng } from 'html-to-image';

import { downloadFile } from '@/lib/utils';

export type TimeUnit = 'Sec' | 'Min' | 'Hrs';

export const TIME_UNITS: TimeUnit[] = ['Sec', 'Min', 'Hrs'];

export const convertToSeconds = (value: number, unit: TimeUnit): number => {
  switch (unit) {
    case 'Sec':
      return value;
    case 'Min':
      return value * 60;
    case 'Hrs':
      return value * 3600;
  }
};

export const secondsToHMS = (
  seconds: number | null | undefined,
): { hours: string; mins: string; secs: string } => {
  if (seconds === null || seconds === undefined || seconds === 0) {
    return { hours: '', mins: '', secs: '' };
  }
  const totalSeconds = Math.round(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    hours: h > 0 ? h.toString() : '',
    mins: m > 0 || h > 0 ? m.toString() : '',
    secs: s > 0 || m > 0 || h > 0 ? s.toString() : '',
  };
};

export const hmsToSeconds = (
  hours: string,
  mins: string,
  secs: string,
): number | null => {
  const h = hours === '' ? 0 : parseInt(hours, 10);
  const m = mins === '' ? 0 : parseInt(mins, 10);
  const s = secs === '' ? 0 : parseInt(secs, 10);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  if (h === 0 && m === 0 && s === 0) return null;
  return h * 3600 + m * 60 + s;
};

export const downloadChartAsPng = async (
  ref: React.RefObject<HTMLDivElement | null>,
  filename: string,
): Promise<void> => {
  if (!ref.current) return;
  try {
    const dataUrl = await toPng(ref.current, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to download chart:', error);
  }
};

export const exportFlowDetailsCsv = (
  flows: {
    flowName: string;
    ownerId?: string | null;
    timeSavedPerRun?: number | null;
    minutesSaved: number;
    projectName: string;
  }[],
): void => {
  if (flows.length === 0) return;
  const header =
    'Flow Name,Owner ID,Time Saved Per Run (seconds),Total Time Saved (seconds),Project Name\n';
  const rows = flows
    .map(
      (f) =>
        `"${f.flowName}","${f.ownerId ?? ''}",${f.timeSavedPerRun ?? 0},${f.minutesSaved},"${f.projectName}"`,
    )
    .join('\n');
  downloadFile({
    obj: header + rows,
    fileName: 'flow-details',
    extension: 'csv',
  });
};
