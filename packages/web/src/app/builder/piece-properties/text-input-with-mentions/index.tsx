import React from 'react';

import { TiptapEditor } from './tiptap-editor';

type TextInputWithMentionsProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
};

export const TextInputWithMentions = (props: TextInputWithMentionsProps) => {
  return <TiptapEditor {...props} />;
};
