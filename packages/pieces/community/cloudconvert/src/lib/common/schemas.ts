import * as z from 'zod/mini'

export const convertFileSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  file: z.optional(z.nullable(z.object({
    base64: z.string(),
    filename: z.optional(z.string()),
    extension: z.optional(z.string()),
  }))),
  url: z.optional(z.nullable(z.string().check(z.url()))),
  stored_file_id: z.optional(z.nullable(z.string())),
  input_format: z.optional(z.nullable(z.string())).check(z.refine((val) => !val || val === 'auto' || val.length > 0, {
    message: "Input format must be either 'auto' or a valid format"
  })),
  output_format: z.string().check(z.minLength(1, 'Output format is required')),
  filename: z.optional(z.nullable(z.string())),
  engine: z.optional(z.nullable(z.string())),
  engine_version: z.optional(z.nullable(z.string())),
  timeout: z.optional(z.nullable(z.number().check(z.positive()))),
  wait_for_completion: z._default(z.boolean(), true),
  store_file: z._default(z.boolean(), true),
}).check(z.refine((data) => {
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
}));

export const captureWebsiteSchema = z.object({
  url: z.string().check(z.url('Valid website URL is required')),
  output_format: z.string().check(z.minLength(1, 'Output format is required')),
  pages: z.optional(z.nullable(z.string())),
  zoom: z.optional(z.nullable(z.number().check(z.positive()))),
  page_width: z.optional(z.nullable(z.number().check(z.positive()))),
  page_height: z.optional(z.nullable(z.number().check(z.positive()))),
  page_format: z.optional(z.nullable(z.string())),
  page_orientation: z.optional(z.nullable(z.string())),
  margin_top: z.optional(z.nullable(z.number().check(z.nonnegative()))),
  margin_bottom: z.optional(z.nullable(z.number().check(z.nonnegative()))),
  margin_left: z.optional(z.nullable(z.number().check(z.nonnegative()))),
  margin_right: z.optional(z.nullable(z.number().check(z.nonnegative()))),
  print_background: z.optional(z.nullable(z.boolean())),
  display_header_footer: z.optional(z.nullable(z.boolean())),
  header_template: z.optional(z.nullable(z.string())),
  footer_template: z.optional(z.nullable(z.string())),
  wait_until: z.optional(z.nullable(z.string())),
  wait_for_element: z.optional(z.nullable(z.string())),
  wait_time: z.optional(z.nullable(z.number().check(z.positive()))),
  css_media_type: z.optional(z.nullable(z.string())),
  filename: z.optional(z.nullable(z.string())),
  engine: z.optional(z.nullable(z.string())),
  engine_version: z.optional(z.nullable(z.string())),
  timeout: z.optional(z.nullable(z.number().check(z.positive()))),
  wait_for_completion: z._default(z.boolean(), true),
  store_file: z._default(z.boolean(), true),
});

export const mergePdfSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  files: z.array(z.object({
    url: z.optional(z.nullable(z.string())),
    file: z.optional(z.nullable(z.object({
      base64: z.string(),
      filename: z.optional(z.string()),
      extension: z.optional(z.string()),
    }))),
    stored_file_id: z.optional(z.nullable(z.string())),
    filename: z.optional(z.nullable(z.string())),
  })).check(z.minLength(2, 'At least 2 files are required for merging')),
  filename: z.optional(z.nullable(z.string())),
  engine: z.optional(z.nullable(z.string())),
  engine_version: z.optional(z.nullable(z.string())),
  timeout: z.optional(z.nullable(z.number().check(z.positive()))),
  wait_for_completion: z._default(z.boolean(), true),
  store_file: z._default(z.boolean(), true),
}).check(z.refine((data) => {
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
}));

export const downloadFileSchema = z.object({
  task_id: z.string().check(z.minLength(1, 'Task ID is required')),
  include: z.optional(z.nullable(z.array(z.string()))),
  store_file: z.optional(z.boolean()),
});

export const archiveFileSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  files: z.array(z.object({
    url: z.optional(z.nullable(z.string())),
    file: z.optional(z.nullable(z.object({
      base64: z.string(),
      filename: z.optional(z.string()),
      extension: z.optional(z.string()),
    }))),
    stored_file_id: z.optional(z.nullable(z.string())),
    filename: z.optional(z.nullable(z.string())),
  })).check(z.minLength(1, 'At least one file is required to create an archive')),
  output_format: z.string().check(z.minLength(1, 'Output format is required')),
  filename: z.optional(z.nullable(z.string())),
  engine: z.optional(z.nullable(z.string())),
  engine_version: z.optional(z.nullable(z.string())),
  timeout: z.optional(z.nullable(z.number().check(z.positive()))),
  wait_for_completion: z._default(z.boolean(), true),
  store_file: z._default(z.boolean(), true),
}).check(z.refine((data) => {
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
}));

export const optimizeFileSchema = z.object({
  import_method: z.enum(['upload', 'url', 'stored_file']),
  file: z.optional(z.nullable(z.object({
    base64: z.string(),
    filename: z.optional(z.string()),
    extension: z.optional(z.string()),
  }))),
  url: z.optional(z.nullable(z.string().check(z.url()))),
  stored_file_id: z.optional(z.nullable(z.string())),
  input_format: z.optional(z.nullable(z.string())),
  profile: z.optional(z.nullable(z.string())),
  flatten_signatures: z.optional(z.nullable(z.boolean())),
  colorspace: z.optional(z.nullable(z.string())),
  filename: z.optional(z.nullable(z.string())),
  engine: z.optional(z.nullable(z.string())),
  engine_version: z.optional(z.nullable(z.string())),
  timeout: z.optional(z.nullable(z.number().check(z.positive()))),
  wait_for_completion: z._default(z.boolean(), true),
  store_file: z._default(z.boolean(), true),
}).check(z.refine((data) => {
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
}));
