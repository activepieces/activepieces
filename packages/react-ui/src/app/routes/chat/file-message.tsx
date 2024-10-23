import { Download } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';

interface FileMessageProps {
  content: string;
}

export const FileMessage: React.FC<FileMessageProps> = ({ content }) => {
  return (
    <Badge
      variant="secondary"
      className="cursor-pointer hover:bg-secondary/80"
      onClick={() => window.open(content, '_blank')}
    >
      <Download className="mr-2 h-4 w-4" /> Download File
    </Badge>
  );
};
