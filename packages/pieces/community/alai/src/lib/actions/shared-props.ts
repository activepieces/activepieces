import { Property } from '@activepieces/pieces-framework';

export const exportFormatOptions = [
  { label: 'Link', value: 'link' },
  { label: 'PDF', value: 'pdf' },
  { label: 'PowerPoint (PPTX)', value: 'ppt' },
];

export const presentationIdProp = (description: string) =>
  Property.ShortText({
    displayName: 'Presentation ID',
    description: `${description} Use "List Presentations" or the presentation_id from "Generate Presentation".`,
    required: true,
  });

export function optionalInt({ value, label, min, max }: { value: unknown; label: string; min: number; max?: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || (max !== undefined && number > max)) {
    throw new Error(`${label} must be a whole number${max !== undefined ? ` from ${min} to ${max}` : ` of at least ${min}`}.`);
  }
  return number;
}
