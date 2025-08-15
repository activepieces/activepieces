import { Loader2, Play } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageBoxProps {
  placeholder: string;
  actionName: string;
  value: string;
  onChange: (value: string) => void;
  onAction: () => void;
  disabled?: boolean;
  rows?: number;
  className?: string;
  actionIcon?: ReactNode;
  loadingIcon?: ReactNode;
  loadingText?: string;
  loading?: boolean;
}

export const MessageBox = ({
  placeholder,
  actionName,
  value,
  onChange,
  onAction,
  disabled = false,
  rows = 2,
  className = '',
  actionIcon = <Play className="w-5 h-5" />,
  loadingIcon = <Loader2 className="w-5 h-5 animate-spin" />,
  loadingText,
  loading = false,
}: MessageBoxProps) => {
  return (
    <div
      className={`flex flex-col gap-2 border rounded-lg p-2 bg-background ${className}`}
    >
      <Textarea
        className="flex-1 resize-none border-none focus:ring-0 focus:border-none shadow-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={loading || disabled}
      />
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          disabled={!value.trim() || loading || disabled}
        >
          {loading ? loadingIcon : actionIcon}
          {loading ? loadingText : actionName}
        </Button>
      </div>
    </div>
  );
};
