import { useFormField } from '@/components/ui/form';

import { TiptapEditor, type TiptapEditorProps } from './tiptap-editor';

export const FormFieldMentionInput = (props: TextInputWithMentionsProps) => {
  const { formItemId } = useFormField();
  return <TiptapEditor {...props} id={formItemId} />;
};

export { TiptapEditor as TextInputWithMentions };

export type TextInputWithMentionsProps = TiptapEditorProps;
