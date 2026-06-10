import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GAP_SIZE_FOR_STEP_SETTINGS = 'gap-3';
export const DASHBOARD_CONTENT_PADDING_X = 'px-4';
