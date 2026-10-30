import { ApFile, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

async function analyze({ token, endpoint, file, sourceFormat, queryParams = {} }: AnalyzeParams): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `https://api.zoo.dev/file/${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    queryParams: { src_format: sourceFormat || sourceFormatFromName({ file }), ...queryParams },
    body: file.data,
  });
  return response.body;
}

function sourceFormatFromName({ file }: { file: ApFile }): string {
  const extension = (file.extension ?? file.filename.split('.').pop() ?? '').replace(/^\./, '').toLowerCase();
  const format = EXTENSION_ALIASES[extension] ?? extension;
  if (!IMPORT_FORMATS.includes(format)) {
    throw new Error(
      `Could not tell the CAD format from the file name "${file.filename}". Set Source Format, or use a file ending in one of: ${[...IMPORT_FORMATS, ...Object.keys(EXTENSION_ALIASES)].join(', ')}.`
    );
  }
  return format;
}

const IMPORT_FORMATS = ['acis', 'catia', 'creo', 'fbx', 'gltf', 'inventor', 'nx', 'obj', 'parasolid', 'ply', 'sldprt', 'step', 'stl'];

const EXTENSION_ALIASES: Record<string, string> = { stp: 'step', glb: 'gltf' };

const sourceFormat = Property.StaticDropdown({
  displayName: 'Source Format',
  description: 'Format of the CAD file. Leave empty to detect it from the file name.',
  required: false,
  options: {
    options: IMPORT_FORMATS.map((format) => ({ label: format.toUpperCase(), value: format })),
  },
});

export const cadFileAnalysis = { analyze, sourceFormat };

type AnalyzeParams = {
  token: string;
  endpoint: string;
  file: ApFile;
  sourceFormat?: string;
  queryParams?: Record<string, string>;
};
