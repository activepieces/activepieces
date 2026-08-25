function normalizeOption(raw: RawOption): RichOption {
  if (typeof raw === 'string') return { label: raw };
  return {
    label: raw.label ?? '',
    icon: raw.icon,
    piece: raw.piece,
    description: raw.description,
  };
}

export function normalizeQuestion(raw: RawMultiQuestion): MultiQuestion {
  const base = { title: raw.title, question: raw.question ?? '' };
  switch (raw.type) {
    case 'multi_choice':
      return {
        ...base,
        type: 'multi_choice',
        options: (raw.options ?? []).map(normalizeOption),
      };
    case 'date':
      return { ...base, type: 'date' };
    case 'date_range':
      return { ...base, type: 'date_range' };
    case 'time':
      return { ...base, type: 'time' };
    case 'slider':
      return {
        ...base,
        type: 'slider',
        min: raw.min ?? 0,
        max: raw.max ?? 100,
        step: raw.step,
        unit: raw.unit,
        defaultValue: raw.defaultValue,
      };
    case 'color':
      return { ...base, type: 'color', presets: raw.presets };
    case 'choice':
    default:
      return {
        ...base,
        type: 'choice',
        options: (raw.options ?? []).map(normalizeOption),
        allowCustom: raw.allowCustom,
      };
  }
}

type RawOption =
  | string
  | { label?: string; icon?: string; piece?: string; description?: string };

export type RawMultiQuestion = {
  type?: string;
  title?: string;
  question?: string;
  options?: RawOption[];
  allowCustom?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  presets?: string[];
};

export type RichOption = {
  label: string;
  icon?: string;
  piece?: string;
  description?: string;
};

export type MultiQuestion =
  | {
      type: 'choice';
      title?: string;
      question: string;
      options: RichOption[];
      allowCustom?: boolean;
    }
  | {
      type: 'multi_choice';
      title?: string;
      question: string;
      options: RichOption[];
    }
  | { type: 'date'; title?: string; question: string }
  | { type: 'date_range'; title?: string; question: string }
  | { type: 'time'; title?: string; question: string }
  | {
      type: 'slider';
      title?: string;
      question: string;
      min: number;
      max: number;
      step?: number;
      unit?: string;
      defaultValue?: number;
    }
  | { type: 'color'; title?: string; question: string; presets?: string[] };
