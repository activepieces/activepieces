import {
  Children,
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

type FileUploadContextValue = {
  isDragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  multiple?: boolean;
  disabled?: boolean;
};

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

export type FileUploadProps = {
  onFilesAdded: (files: File[]) => void;
  children: React.ReactNode;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
};

function FileUpload({
  onFilesAdded,
  children,
  multiple = true,
  accept,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (files: FileList) => {
      const newFiles = Array.from(files);
      if (multiple) {
        onFilesAdded(newFiles);
      } else {
        onFilesAdded(newFiles.slice(0, 1));
      }
    },
    [multiple, onFilesAdded],
  );

  useEffect(() => {
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragIn = (e: DragEvent) => {
      handleDrag(e);
      dragCounter.current++;
      if (e.dataTransfer?.items.length) setIsDragging(true);
    };

    const handleDragOut = (e: DragEvent) => {
      handleDrag(e);
      dragCounter.current--;
      if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      handleDrag(e);
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer?.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragIn);
    window.addEventListener('dragleave', handleDragOut);
    window.addEventListener('dragover', handleDrag);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragIn);
      window.removeEventListener('dragleave', handleDragOut);
      window.removeEventListener('dragover', handleDrag);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFiles, onFilesAdded, multiple]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <FileUploadContext.Provider
      value={{ isDragging, inputRef, multiple, disabled }}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        accept={accept}
        aria-hidden
        disabled={disabled}
      />
      {children}
    </FileUploadContext.Provider>
  );
}

export type FileUploadTriggerProps =
  React.ComponentPropsWithoutRef<'button'> & {
    asChild?: boolean;
  };

function FileUploadTrigger({
  asChild = false,
  className,
  children,
  ...props
}: FileUploadTriggerProps) {
  const context = useContext(FileUploadContext);
  const handleClick = () => context?.inputRef.current?.click();

  if (asChild) {
    const child = Children.only(children) as React.ReactElement<
      React.HTMLAttributes<HTMLElement>
    >;
    return cloneElement(child, {
      ...props,
      role: 'button',
      className: cn(className, child.props.className),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        handleClick();
        child.props.onClick?.(e as React.MouseEvent<HTMLElement>);
      },
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

type FileUploadContentProps = React.HTMLAttributes<HTMLDivElement>;

function FileUploadContent({ className, ...props }: FileUploadContentProps) {
  const context = useContext(FileUploadContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!context?.isDragging || !mounted || context?.disabled) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
        'animate-in fade-in-0 slide-in-from-bottom-10 zoom-in-90 duration-150',
        className,
      )}
      {...props}
    />
  );

  return createPortal(content, document.body);
}

export { FileUpload, FileUploadTrigger, FileUploadContent };
