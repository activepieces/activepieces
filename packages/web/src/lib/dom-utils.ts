import JSZip from 'jszip';

export const isStepFileUrl = (json: unknown): json is string => {
  if (!json || typeof json !== 'string') {
    return false;
  }
  // `/api/v1/step-files/` is an Activepieces-unique path, so the bare match is
  // safe. `/api/v1/files/` (the unified storage route, GIT-1618) is a generic
  // REST shape a third-party output URL can also share — Pipedrive's own API is
  // literally `<domain>/api/v1/files/...`. So additionally require the signed
  // `token=` query param every real file read URL carries. Match it as a discrete
  // query param (`?token=` / `&token=`), NOT a bare `token=` substring, so a
  // differently-named param (Pipedrive `?api_token=`, OAuth `?access_token=`)
  // is not mistaken for a downloadable file.
  const hasSignedTokenParam =
    json.includes('?token=') || json.includes('&token=');
  return (
    json.includes('/api/v1/step-files/') ||
    (json.includes('/api/v1/files/') && hasSignedTokenParam) ||
    json.includes('file://')
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

export const isEditableTarget = (target: EventTarget | null): boolean => {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  );
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
