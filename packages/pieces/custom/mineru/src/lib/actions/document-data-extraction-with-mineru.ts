import { createAction, Property } from '@activepieces/pieces-framework';

export const getDocumentContent = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'minerUDocumentDataExtraction',
  displayName: 'Document content extraction with MinerU',
  description: 'Extract the content of the given document with MinuerU',
  props: {
    file: Property.File({
        displayName: 'File for parsing',
        description: 'base64 file from readFile piece',
        required: true,
    }),
    mimeType: Property.ShortText({
        displayName: 'MIME Type',
        required: true,
        defaultValue: 'application/pdf',
    }),
    langList: Property.ShortText({
        displayName: 'Document language',
        description: 'Improves OCR accuracy with "pipeline" backend only. Supported values : ch , ch_server, ch_lite, en, korean, japan, chinese_cht, ta, te, ka, th, el, latin, arabic, east_slavic, cyrillic, devanagari',
        required: true,
        defaultValue: 'latin',
    }),
    backend: Property.StaticDropdown({
        displayName: 'Backend for parsing',
        required: true,
        defaultValue: 'pipeline',
        options: {
            options: [
                {
                    label: 'pipeline: More general',
                    value: 'pipeline',
                },
                {
                    label: 'vlm-transformers:  More general, but slower',
                    value: 'vlm-transformers',
                },
                {
                    label: 'vlm-mlx-engine: Faster than transformers (need apple silicon and macOS 13.5+)',
                    value: 'vlm-mlx-engine',
                },
                {
                    label: 'vlm-vllm-async-engine: Faster (vllm-engine, need vllm installed)',
                    value: 'vlm-vllm-async-engine',
                },
                {
                    label: 'vlm-lmdeploy-engine: Faster (lmdeploy-engine, need lmdeploy installed)',
                    value: 'vlm-lmdeploy-engine',
                },
                {
                    label: 'vlm-http-client: Faster (client suitable for openai-compatible servers)',
                    value: 'vlm-http-client',
                },
            ],
        },
    }),
    parseMethod: Property.StaticDropdown({
        displayName: 'The method for parsing PDF',
        description: 'Adapted only for pipeline backend',
        required: true,
        defaultValue: 'auto',
        options: {
            options: [
                {
                    label: 'auto - Automatically determine the method based on the file type',
                    value: 'auto',
                },
                {
                    label: 'txt - Use text extraction method',
                    value: 'txt',
                },
                {
                    label: 'ocr - ocr',
                    value: 'ocr',
                },
            ],
        },
    }),
    formulaEnable: Property.Checkbox({
        displayName: 'Enable formula parsing',
        required: false,
        defaultValue: true,
    }),
    tableEnable: Property.Checkbox({
        displayName: 'Enable table parsing',
        required: false,
        defaultValue: true,
    }),
    returnMD: Property.Checkbox({
        displayName: 'Return markdown content in response',
        required: false,
        defaultValue: true,
    }),
    returnMiddleJson: Property.Checkbox({
        displayName: 'Return middle JSON in response',
        required: false,
        defaultValue: false,
    }),
    returnModelOutput: Property.Checkbox({
        displayName: 'Return model output JSON in response',
        required: false,
        defaultValue: false,
    }),
    returnContentList: Property.Checkbox({
        displayName: 'Return content list JSON in response',
        required: false,
        defaultValue: false,
    }),
    returnImages: Property.Checkbox({
        displayName: 'Return extracted images in response',
        required: false,
        defaultValue: false,
    }),
    responseFormatZip: Property.Checkbox({
        displayName: 'Return results as a ZIP file instead of JSON',
        required: false,
        defaultValue: false,
    }),
    startPageId: Property.Number({
        displayName: 'The starting page for PDF parsing, beginning from 0',
        required: false,
        defaultValue: 0,
    }),
    endPageId: Property.Number({
        displayName: 'The ending page for PDF parsing, beginning from 0',
        required: false,
        defaultValue: 99999,
    }),
    serverUrl: Property.ShortText({
        displayName: '(Adapted only for vlm-http-client backend)openai compatible server url, e.g., http://127.0.0.1:30000',
        required: false
    }),
  },
  async run(context) {
    const { file, mimeType, langList, backend, parseMethod, formulaEnable, tableEnable, returnMD, returnMiddleJson, returnModelOutput, returnContentList, returnImages, responseFormatZip, startPageId, endPageId, serverUrl } = context.propsValue;

    // Conversion base64 en Uint8Array -> Blob
    const binaryString = atob(file.base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++)
        bytes[i] = binaryString.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });

    // Création FormData
    const form = new FormData();
    form.append('files', blob, file.filename);
    form.append('lang_list', String(langList));
    form.append('backend', String(backend));
    form.append('parse_method', String(parseMethod));
    form.append('formula_enable', formulaEnable ? 'true' : 'false');
    form.append('table_enable', tableEnable ? 'true' : 'false');
    if (serverUrl && serverUrl != null && serverUrl != '')
        form.append('server_url', String(serverUrl));
    form.append('return_md', returnMD ? 'true' : 'false');
    form.append('return_middle_json', returnMiddleJson ? 'true' : 'false');
    form.append('return_model_output', returnModelOutput ? 'true' : 'false');
    form.append('return_content_list', returnContentList ? 'true' : 'false');
    form.append('return_images', returnImages ? 'true' : 'false');
    form.append('response_format_zip', responseFormatZip ? 'true' : 'false');
    form.append('start_page_id', String(startPageId));
    form.append('end_page_id', String(endPageId));

    // Envoi vers MinerU
    const response = await fetch(`${serverUrl}/file_parse`, {
        method: 'POST',
        body: form,
    });
    return await response.json();
  },
});
