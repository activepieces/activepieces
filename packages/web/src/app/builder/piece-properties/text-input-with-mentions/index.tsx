import { TiptapEditor } from './tiptap-editor';

type TextInputWithMentionsProps = {
  className?: string;
  wrapperClassName?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
  autoFocus?: boolean;
  outputFormat?: 'text' | 'html';
};

export const TextInputWithMentions = (props: TextInputWithMentionsProps) => {
  return <TiptapEditor {...props} />;
};

export type { TextInputWithMentionsProps };
