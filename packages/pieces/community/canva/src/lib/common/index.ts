export const canvaCommon = {
  baseUrl: 'https://api.canva.com/rest/v1',
};

export interface DesignTypeInput {
  type: 'preset' | 'custom';
  name?: 'doc' | 'whiteboard' | 'presentation'; // Required if type is 'preset'
  width?: number; // Required if type is 'custom', min: 40, max: 8000
  height?: number; // Required if type is 'custom', min: 40, max: 8000
}

// Request body for create design API
export interface CanvaDesignCreateRequest {
  design_type?: DesignTypeInput;
  asset_id?: string;
  title?: string; // Min length: 1, Max length: 255
}

// Owner information
export interface TeamUserSummary {
  user_id: string;
  team_id: string;
}

// Design URLs
export interface DesignLinks {
  edit_url: string;
  view_url: string;
}

// Thumbnail information
export interface Thumbnail {
  width: number;
  height: number;
  url: string;
}

// Design response structure
export interface Design {
  id: string;
  title?: string;
  owner: TeamUserSummary;
  urls: DesignLinks;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  thumbnail?: Thumbnail;
  page_count?: number;
}

// API response wrapper
export interface CanvaDesignResponse {
  design: Design;
}

// Folder information
export interface Folder {
  id: string;
  name: string;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  thumbnail?: Thumbnail;
}

// Folder response wrapper
export interface FolderResponse {
  folder: Folder;
}

// Asset summary for folder items
export interface AssetSummary {
  type: 'image' | 'video';
  id: string;
  name: string;
  tags: string[];
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  thumbnail?: Thumbnail;
}

// Folder item summary - polymorphic structure
export interface FolderItemSummary {
  type: 'folder' | 'design' | 'image';
  folder?: Folder; // Present when type is 'folder'
  design?: DesignSummary; // Present when type is 'design'
  image?: AssetSummary; // Present when type is 'image'
}

// List folder items response
export interface ListFolderItemsResponse {
  items: FolderItemSummary[];
  continuation?: string;
}

// Asset upload metadata for header
export interface AssetUploadMetadata {
  name_base64: string; // Asset name encoded in Base64, max 50 chars unencoded
}

// Asset upload error
export interface AssetUploadError {
  code: 'file_too_big' | 'import_failed' | 'fetch_failed';
  message: string;
}

export interface ImportError {
  code: 'file_too_big' | 'import_failed';
  message: string;
}

export interface ImportStatus {
  state: 'failed' | 'in_progress' | 'success';
  error?: ImportError;
}

// Asset information
export interface Asset {
  type: 'image' | 'video';
  id: string;
  name: string;
  tags: string[];
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  thumbnail?: Thumbnail;
  import_status?: ImportStatus; // deprecated
}

// Asset upload job
export interface AssetUploadJob {
  id: string;
  status: 'failed' | 'in_progress' | 'success';
  error?: AssetUploadError;
  asset?: Asset;
}

// Asset upload response
export interface AssetUploadResponse {
  job: AssetUploadJob;
}

// Asset response wrapper
export interface AssetResponse {
  asset: Asset;
}

// Design import metadata for header
export interface DesignImportMetadata {
  title_base64: string; // Design title encoded in Base64, max 50 chars unencoded
  mime_type?: string; // Optional MIME type
}

// Design summary for import results
export interface DesignSummary {
  id: string;
  title?: string;
  url?: string;
  urls: DesignLinks;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  thumbnail?: Thumbnail;
  page_count?: number;
}

// Design import job result
export interface DesignImportJobResult {
  designs: DesignSummary[]; // Usually contains one item, may be split for large files
}

// Design import error
export interface DesignImportError {
  code: 'design_creation_throttled' | 'design_import_throttled' | 'duplicate_import' | 'internal_error' | 'invalid_file' | 'fetch_failed';
  message: string;
}

// Design import job
export interface DesignImportJob {
  id: string;
  status: 'failed' | 'in_progress' | 'success';
  result?: DesignImportJobResult;
  error?: DesignImportError;
}

// Design import response
export interface DesignImportResponse {
  job: DesignImportJob;
}

// Export format structure
export interface ExportFormat {
  type: 'pdf' | 'jpg' | 'png' | 'gif' | 'pptx' | 'mp4';
  quality?: number | string; // Required for jpg (1-100) and mp4 (e.g., 'horizontal_1080p')
  pages?: number[]; // Specific pages to export
  export_quality?: 'regular' | 'pro'; // Export quality level
  size?: 'a4' | 'a3' | 'letter' | 'legal'; // PDF paper size (for Canva Docs)
  height?: number; // For jpg, png, gif (40-25000)
  width?: number; // For jpg, png, gif (40-25000)
  lossless?: boolean; // PNG compression (default true)
  transparent_background?: boolean; // PNG transparent background (Pro feature)
  as_single_image?: boolean; // PNG multi-page merge (default false)
}

// Export error
export interface ExportError {
  code: 'license_required' | 'approval_required' | 'internal_failure';
  message: string;
}

// Export job
export interface ExportJob {
  id: string;
  status: 'failed' | 'in_progress' | 'success';
  urls?: string[]; // Download URLs, expire after 24 hours
  error?: ExportError;
}

// Export request
export interface ExportRequest {
  design_id: string;
  format: ExportFormat;
}

// Export response
export interface ExportResponse {
  job: ExportJob;
}

// File format validation
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'heic', 'gif', 'tiff', 'webp'];
export const SUPPORTED_VIDEO_FORMATS = ['m4v', 'mkv', 'mp4', 'mpeg', 'mov', 'webm'];

// Supported import file formats with MIME types
export const SUPPORTED_IMPORT_FORMATS = [
  { ext: 'ai', mime: 'application/illustrator', name: 'Adobe Illustrator' },
  { ext: 'psd', mime: 'image/vnd.adobe.photoshop', name: 'Adobe Photoshop' },
  { ext: 'key', mime: 'application/vnd.apple.keynote', name: 'Apple Keynote' },
  { ext: 'numbers', mime: 'application/vnd.apple.numbers', name: 'Apple Numbers' },
  { ext: 'pages', mime: 'application/vnd.apple.pages', name: 'Apple Pages' },
  { ext: 'xls', mime: 'application/vnd.ms-excel', name: 'Microsoft Excel (pre 2007)' },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Microsoft Excel' },
  { ext: 'ppt', mime: 'application/vnd.ms-powerpoint', name: 'Microsoft PowerPoint (pre 2007)' },
  { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'Microsoft PowerPoint' },
  { ext: 'doc', mime: 'application/msword', name: 'Microsoft Word (pre 2007)' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Microsoft Word' },
  { ext: 'odg', mime: 'application/vnd.oasis.opendocument.graphics', name: 'OpenOffice Draw' },
  { ext: 'odp', mime: 'application/vnd.oasis.opendocument.presentation', name: 'OpenOffice Presentation' },
  { ext: 'ods', mime: 'application/vnd.oasis.opendocument.spreadsheet', name: 'OpenOffice Sheets' },
  { ext: 'odt', mime: 'application/vnd.oasis.opendocument.text', name: 'OpenOffice Text' },
  { ext: 'pdf', mime: 'application/pdf', name: 'PDF' },
];

// Export format constants
export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'gif', label: 'GIF' },
  { value: 'pptx', label: 'PowerPoint (PPTX)' },
  { value: 'mp4', label: 'MP4 Video' },
];

export const PDF_SIZES = [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
];

export const MP4_QUALITIES = [
  { value: 'horizontal_480p', label: 'Horizontal 480p' },
  { value: 'horizontal_720p', label: 'Horizontal 720p' },
  { value: 'horizontal_1080p', label: 'Horizontal 1080p' },
  { value: 'horizontal_4k', label: 'Horizontal 4K' },
  { value: 'vertical_480p', label: 'Vertical 480p' },
  { value: 'vertical_720p', label: 'Vertical 720p' },
  { value: 'vertical_1080p', label: 'Vertical 1080p' },
  { value: 'vertical_4k', label: 'Vertical 4K' },
];

// File size limits
export const MAX_IMAGE_SIZE_MB = 50;
export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_ASSET_NAME_LENGTH = 50;
export const MAX_DESIGN_TITLE_LENGTH = 50;

// Export dimension limits
export const MIN_EXPORT_DIMENSION = 40;
export const MAX_EXPORT_DIMENSION = 25000;

// Dynamic field helpers
export async function fetchUserDesigns(auth: any, query?: string): Promise<Array<{ label: string; value: string }>> {
  try {
    const params = new URLSearchParams();
    if (query && query.trim()) {
      params.append('query', query.trim());
    }
    params.append('sort_by', 'modified_descending');

    const response = await fetch(`${canvaCommon.baseUrl}/designs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((design: any) => ({
      label: design.title || `Design ${design.id}`,
      value: design.id,
    }));
  } catch (error) {
    console.error('Failed to fetch designs:', error);
    return [];
  }
}

export async function fetchUserAssets(auth: any, assetType?: 'image' | 'video'): Promise<Array<{ label: string; value: string }>> {
  try {
    const response = await fetch(`${canvaCommon.baseUrl}/folders/root/items?item_types=image`, {
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || [])
      .filter((item: any) => item.type === 'image' && (!assetType || item.image?.type === assetType))
      .map((item: any) => ({
        label: item.image?.name || `Asset ${item.image?.id}`,
        value: item.image?.id || '',
      }))
      .filter((item: any) => item.value);
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return [];
  }
}

export async function fetchUserFolders(auth: any): Promise<Array<{ label: string; value: string }>> {
  try {
    const folders = [{ label: 'Root (Top Level)', value: 'root' }];
    
    const response = await fetch(`${canvaCommon.baseUrl}/folders/root/items?item_types=folder`, {
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
    });

    if (!response.ok) return folders;

    const data = await response.json();
    const subfolders = (data.items || [])
      .filter((item: any) => item.type === 'folder')
      .map((item: any) => ({
        label: item.folder?.name || `Folder ${item.folder?.id}`,
        value: item.folder?.id || '',
      }))
      .filter((item: any) => item.value);

    return [...folders, ...subfolders];
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return [{ label: 'Root (Top Level)', value: 'root' }];
  }
} 