import React from 'react';

import { FileResponseInterface } from '@activepieces/shared';

import { FileMessage } from './file-message';
import { ImageMessage } from './image-message';
import { TextMessage } from './text-message';

interface MultiMediaMessageProps {
  textContent?: string;
  role: 'user' | 'bot';
  attachments?: FileResponseInterface[];
  setSelectedImage: (image: string | null) => void;
}

export const MultiMediaMessage: React.FC<MultiMediaMessageProps> = ({
  textContent,
  role,
  attachments,
  setSelectedImage,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Text content */}
      {textContent && <TextMessage content={textContent} role={role} />}

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {attachments.map((attachment, index) => {
            if ('url' in attachment && 'mimeType' in attachment) {
              const isImage = attachment.mimeType?.startsWith('image/');
              return isImage ? (
                <ImageMessage
                  key={index}
                  content={attachment.url}
                  setSelectedImage={setSelectedImage}
                />
              ) : (
                <FileMessage
                  key={index}
                  content={attachment.url}
                  mimeType={attachment.mimeType}
                  fileName={attachment.fileName}
                  role={role}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
