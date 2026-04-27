import { z } from 'zod';

export const FieldFormat = z.enum([
  'email',
  'url',
  'date',
  'datetime',
  'number',
  'boolean',
  'image',
  'html',
  'currency',
  'filesize',
  'duration',
]);
export type FieldFormat = z.infer<typeof FieldFormat>;

export type HintField = {
  key: string;
  label?: string;
  value?: string;
  format?: FieldFormat;
  description?: string;
  dynamicKey?: true;
  children?: HintField[];
  listItems?: HintField[];
};

export const HintField: z.ZodType<HintField> = z.lazy(() =>
  z.object({
    key: z.string(),
    label: z.string().optional(),
    value: z.string().optional(),
    format: FieldFormat.optional(),
    description: z.string().optional(),
    dynamicKey: z.literal(true).optional(),
    children: z.array(HintField).optional(),
    listItems: z.array(HintField).optional(),
  }),
);

export const OutputDisplayHints = z.object({
  hero: z.array(HintField),
  secondary: z.array(HintField).optional(),
  label: z.string().optional(),
});
export type OutputDisplayHints = z.infer<typeof OutputDisplayHints>;

export function defineHints(hints: OutputDisplayHints): OutputDisplayHints {
  return hints;
}
