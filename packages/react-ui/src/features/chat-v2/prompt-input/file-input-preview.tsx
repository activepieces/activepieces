import { FileIcon, Loader2, X, AlertCircle } from 'lucide-react';

export type UploadingFile = {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
};

type FileInputPreviewProps = {
  uploadingFile: UploadingFile;
  onRemove: (id: string) => void;
};

export const FileInputPreview = ({
  uploadingFile,
  onRemove,
}: FileInputPreviewProps) => {
  const { id, file, status } = uploadingFile;
  const isUploading = status === 'uploading';
  const isError = status === 'error';

  return (
    <div
      className={`group relative inline-flex items-center gap-2 bg-muted/50 border rounded-md px-3 py-1.5 max-w-[200px] ${
        isError ? 'border-destructive' : 'border-border'
      }`}
    >
      {isUploading ? (
        <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
      ) : isError ? (
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
      ) : (
        <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
      <span className={`text-sm truncate ${isError ? 'text-destructive' : 'text-foreground'}`}>
        {file.name}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
