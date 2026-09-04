import { useFormField } from '@/components/ui/form';

import { TiptapEditor } from './tiptap-editor';

export const TextInputWithMentions = (props: TextInputWithMentionsProps) => {
  return <TiptapEditor {...props} />;
};

export const FormFieldMentionInput = (props: TextInputWithMentionsProps) => {
  const { formItemId } = useFormField();
  return <TextInputWithMentions {...props} id={formItemId} />;
};

type TextInputWithMentionsProps = {
  id?: string;
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

export type { TextInputWithMentionsProps };
