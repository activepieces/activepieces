import JSZip from 'jszip';

export const isStepFileUrl = (json: unknown): json is string => {
  return (
    Boolean(json) &&
    typeof json === 'string' &&
    (json.includes('/api/v1/step-files/') || json.includes('file://'))
  );
};

export const parentWindow: Window = window.opener ?? window.parent;

export const cleanLeadingSlash = (url: string) => {
  return url.startsWith('/') ? url.slice(1) : url;
};

export const cleanTrailingSlash = (url: string) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const combinePaths = ({
  firstPath,
  secondPath,
}: {
  firstPath: string;
  secondPath: string;
}) => {
  const cleanedFirstPath = cleanTrailingSlash(firstPath);
  const cleanedSecondPath = cleanLeadingSlash(secondPath);
  return `${cleanedFirstPath}/${cleanedSecondPath}`;
};

export const downloadFile = async ({
  obj,
  fileName,
  extension,
}: DownloadFileProps) => {
  const blob =
    extension === 'zip'
      ? await obj.generateAsync({ type: 'blob' })
      : //utf-8 with bom
        new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), obj], {
          type: getBlobType(extension),
        });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const scrollToElementAndClickIt = (elementId: string) => {
  const element = document.getElementById(elementId);
  element?.scrollIntoView({
    behavior: 'instant',
    block: 'start',
  });
  element?.click();
};

export const isMac = () => {
  return /(Mac)/i.test(navigator.userAgent);
};

function getBlobType(extension: 'json' | 'txt' | 'csv') {
  switch (extension) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    default:
      return `text/plain`;
  }
}

type DownloadFileProps =
  | {
      obj: string;
      fileName: string;
      extension: 'json' | 'txt' | 'csv';
    }
  | {
      obj: JSZip;
      fileName: string;
      extension: 'zip';
    };
