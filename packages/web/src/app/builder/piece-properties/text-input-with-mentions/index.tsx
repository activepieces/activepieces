import { useEffect } from 'react';

import { useFormField } from '@/components/ui/form';

import { TiptapEditor, type TiptapEditorProps } from './tiptap-editor';

export const FormFieldMentionInput = (props: TextInputWithMentionsProps) => {
  const { formItemId } = useFormField();
  useReportUnusableFormItemId(formItemId);
  return <TiptapEditor {...props} id={formItemId} />;
};

export { TiptapEditor as TextInputWithMentions };

function useReportUnusableFormItemId(formItemId: string) {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    if (formItemId.startsWith('undefined-')) {
      console.error(
        `FormFieldMentionInput is outside a <FormItem>, so its id "${formItemId}" is shared with every other editor in the same state. Render it inside the <FormItem> that owns its <FormLabel>, or use TextInputWithMentions.`,
      );
      return;
    }
    if (document.querySelectorAll(`[id="${formItemId}"]`).length > 1) {
      console.error(
        `FormFieldMentionInput repeated id "${formItemId}": one <FormItem> holds more than one editor, so its <FormLabel> resolves to whichever comes first. Use TextInputWithMentions for editors a label does not name.`,
      );
    }
  }, [formItemId]);
}

export type TextInputWithMentionsProps = TiptapEditorProps;
