import z from 'zod';

export const convertFileSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  file: z.object({
    base64: z.string(),
    filename: z.string().optional(),
    extension: z.string().optional(),
  }).nullable().optional(),
  url: z.string().url().nullable().optional(),
  stored_file_id: z.string().nullable().optional(),
  input_format: z.string().nullable().optional().refine((val) => !val || val === 'auto' || val.length > 0, {
    message: "Input format must be either 'auto' or a valid format"
  }),
  output_format: z.string().min(1, 'Output format is required'),
  filename: z.string().nullable().optional(),
  engine: z.string().nullable().optional(),
  engine_version: z.string().nullable().optional(),
  timeout: z.number().positive().nullable().optional(),
  wait_for_completion: z.boolean().default(true),
  store_file: z.boolean().default(true),
}).refine((data) => {
  if (data.import_method === 'upload') {
    return data.file && data.file.base64;
  } else if (data.import_method === 'url') {
    return data.url;
  } else if (data.import_method === 'stored_file') {
    return data.stored_file_id;
  }
  return false;
}, {
  message: "File is required for upload method, URL is required for URL method, Stored File ID is required for stored file method",
  path: ["file"]
});

export const captureWebsiteSchema = z.object({
  url: z.string().url('Valid website URL is required'),
  output_format: z.string().min(1, 'Output format is required'),
  pages: z.string().nullable().optional(),
  zoom: z.number().positive().nullable().optional(),
  page_width: z.number().positive().nullable().optional(),
  page_height: z.number().positive().nullable().optional(),
  page_format: z.string().nullable().optional(),
  page_orientation: z.string().nullable().optional(),
  margin_top: z.number().nonnegative().nullable().optional(),
  margin_bottom: z.number().nonnegative().nullable().optional(),
  margin_left: z.number().nonnegative().nullable().optional(),
  margin_right: z.number().nonnegative().nullable().optional(),
  print_background: z.boolean().nullable().optional(),
  display_header_footer: z.boolean().nullable().optional(),
  header_template: z.string().nullable().optional(),
  footer_template: z.string().nullable().optional(),
  wait_until: z.string().nullable().optional(),
  wait_for_element: z.string().nullable().optional(),
  wait_time: z.number().positive().nullable().optional(),
  css_media_type: z.string().nullable().optional(),
  filename: z.string().nullable().optional(),
  engine: z.string().nullable().optional(),
  engine_version: z.string().nullable().optional(),
  timeout: z.number().positive().nullable().optional(),
  wait_for_completion: z.boolean().default(true),
  store_file: z.boolean().default(true),
});

export const mergePdfSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  files: z.array(z.object({
    url: z.string().nullable().optional(),
    file: z.object({
      base64: z.string(),
      filename: z.string().optional(),
      extension: z.string().optional(),
    }).nullable().optional(),
    stored_file_id: z.string().nullable().optional(),
    filename: z.string().nullable().optional(),
  })).min(2, 'At least 2 files are required for merging'),
  filename: z.string().nullable().optional(),
  engine: z.string().nullable().optional(),
  engine_version: z.string().nullable().optional(),
  timeout: z.number().positive().nullable().optional(),
  wait_for_completion: z.boolean().default(true),
  store_file: z.boolean().default(true),
}).refine((data) => {
  return data.files.every(fileItem => {
    if (data.import_method === 'upload') {
      return fileItem.file && fileItem.file.base64;
    } else if (data.import_method === 'url') {
      return fileItem.url;
    } else if (data.import_method === 'stored_file') {
      return fileItem.stored_file_id;
    }
    return false;
  });
}, {
  message: "All files must have valid input based on the selected import method",
  path: ["files"]
});

export const downloadFileSchema = z.object({
  task_id: z.string().min(1, 'Task ID is required'),
  include: z.array(z.string()).nullable().optional(),
  store_file: z.boolean().optional(),
});

export const archiveFileSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  files: z.array(z.object({
    url: z.string().nullable().optional(),
    file: z.object({
      base64: z.string(),
      filename: z.string().optional(),
      extension: z.string().optional(),
    }).nullable().optional(),
    stored_file_id: z.string().nullable().optional(),
    filename: z.string().nullable().optional(),
  })).min(1, 'At least one file is required to create an archive'),
  output_format: z.string().min(1, 'Output format is required'),
  filename: z.string().nullable().optional(),
  engine: z.string().nullable().optional(),
  engine_version: z.string().nullable().optional(),
  timeout: z.number().positive().nullable().optional(),
  wait_for_completion: z.boolean().default(true),
  store_file: z.boolean().default(true),
}).refine((data) => {
  return data.files.every(fileItem => {
    if (data.import_method === 'upload') {
      return fileItem.file && fileItem.file.base64;
    } else if (data.import_method === 'url') {
      return fileItem.url;
    } else if (data.import_method === 'stored_file') {
      return fileItem.stored_file_id;
    }
    return false;
  });
}, {
  message: "All files must have valid input based on the selected import method",
  path: ["files"]
});

export const optimizeFileSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  file: z.object({
    base64: z.string(),
    filename: z.string().optional(),
    extension: z.string().optional(),
  }).nullable().optional(),
  url: z.string().url().nullable().optional(),
  stored_file_id: z.string().nullable().optional(),
  input_format: z.string().nullable().optional(),
  profile: z.string().nullable().optional(),
  flatten_signatures: z.boolean().nullable().optional(),
  colorspace: z.string().nullable().optional(),
  filename: z.string().nullable().optional(),
  engine: z.string().nullable().optional(),
  engine_version: z.string().nullable().optional(),
  timeout: z.number().positive().nullable().optional(),
  wait_for_completion: z.boolean().default(true),
  store_file: z.boolean().default(true),
}).refine((data) => {
  if (data.import_method === 'upload') {
    return data.file && data.file.base64;
  } else if (data.import_method === 'url') {
    return data.url;
  } else if (data.import_method === 'stored_file') {
    return data.stored_file_id;
  }
  return false;
}, {
  message: "File is required for upload method, URL is required for URL method, Stored File ID is required for stored file method",
  path: ["file"]
});
