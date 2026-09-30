import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: ResizableTextareaProps) {
  return (
    <TextareaAutosize
      data-slot="textarea"
      cacheMeasurements={false}
      minRows={1}
      maxRows={5}
      className={cn(
        'flex min-h-10 w-full rounded-lg border border-gray-7 bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-gray-11 focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
type Style = Omit<
  NonNullable<TextareaProps['style']>,
  'maxHeight' | 'minHeight'
> & {
  height?: number;
};
type TextareaHeightChangeMeta = {
  rowHeight: number;
};
interface TextareaAutosizeProps extends Omit<TextareaProps, 'style'> {
  maxRows?: number;
  minRows?: number;
  onHeightChange?: (height: number, meta: TextareaHeightChangeMeta) => void;
  cacheMeasurements?: boolean;
  style?: Style;
}

export type ResizableTextareaProps = TextareaAutosizeProps &
  React.RefAttributes<HTMLTextAreaElement>;
