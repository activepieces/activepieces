import { z } from 'zod';

const FieldFormat = z.enum([
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

const HintField: z.ZodType<HintField> = z.lazy(() =>
  z.object({
    k: z.string(),
    l: z.string().optional(),
    v: z.string().optional(),
    f: FieldFormat.optional(),
    d: z.string().optional(),
    dk: z.literal(true).optional(),
    c: z.array(HintField).optional(),
    li: z.array(HintField).optional(),
  }),
);

export type HintField = {
  k: string;
  l?: string;
  v?: string;
  f?: FieldFormat;
  d?: string;
  dk?: true;
  c?: HintField[];
  li?: HintField[];
};

export const OutputDisplayHints = z.object({
  hero: z.array(HintField),
  secondary: z.array(HintField).optional(),
  label: z.string().optional(),
});
export type OutputDisplayHints = z.infer<typeof OutputDisplayHints>;

export function defineHints(hints: OutputDisplayHints): OutputDisplayHints {
  return hints;
}
