export const JOURNAL_ELEMENT = {
  COMMENTS: 'comments',
  WORK_NOTES: 'work_notes',
} as const;

export type JournalElement =
  (typeof JOURNAL_ELEMENT)[keyof typeof JOURNAL_ELEMENT];

export const JOURNAL_ELEMENT_FILTER = {
  BOTH: 'both',
  ...JOURNAL_ELEMENT,
} as const;
