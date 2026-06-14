export type MultiQuestion = {
  title?: string;
  question: string;
  type: 'choice' | 'text';
  options?: string[];
  placeholder?: string;
};
