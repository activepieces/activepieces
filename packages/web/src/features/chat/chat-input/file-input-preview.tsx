import { FileIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type FileInputPreviewProps = {
  file: File;
  index: number;
  onRemove: (index: number) => void;
};

export const FileInputPreview = ({
  file,
  index,
  onRemove,
}: FileInputPreviewProps) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <div key={index} className="relative inline-block mr-2 mt-2 mb-3">
      {isImage && (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
      )}
      {isVideo && (
        <video
          src={URL.createObjectURL(file)}
          className="w-20 h-20 object-cover rounded-lg"
        />
      )}
      {!isImage && !isVideo && (
        <div className="w-20 h-20 bg-foreground text-background rounded-lg flex items-center justify-center">
          <FileIcon className="w-8 h-8" />
        </div>
      )}
      <Button
        variant="destructive"
        size="icon"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute -top-2 -right-2 rounded-full p-1 size-6"
      >
        <X className="w-3 h-3" />
      </Button>
      <p className="text-xs mt-1 truncate w-20">{file.name}</p>
    </div>
  );
};
