import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
//import { z } from 'zod';

export const documentAnalysisWithMineru = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'documentAnalysisWithMineru',
  displayName: 'Document analysis with MinerU',
  description: 'Analyse the given document with MinuerU model',
  props: {
    file: Property.File({
        displayName: 'Fichier à analyser',
        required: true,
        description: 'Contenu du fichier soit depuis une URL soit depuis Read File',
    }),
    mimeType: Property.ShortText({
        displayName: 'Type MIME',
        required: false,
        defaultValue: 'application/pdf',
    }),
    formulaEnable: Property.Checkbox({
        displayName: 'Activer la reconaissance des formules',
        required: false,
        defaultValue: false,
    }),
    tableEnable: Property.Checkbox({
        displayName: 'Activer la reconaissance des tableaux',
        required: false,
        defaultValue: false,
    }),
    returnMD: Property.Checkbox({
        displayName: 'Retourner le Markdown',
        required: false,
        defaultValue: true,
    }),
    returnMiddleJson: Property.Checkbox({
        displayName: 'Retourner le JSON intermédiaire',
        required: false,
        defaultValue: false,
    }),
    returnModelOutput: Property.Checkbox({
        displayName: 'Retourner le output du modèle',
        required: false,
        defaultValue: false,
    }),
    returnImages: Property.Checkbox({
        displayName: 'Retourner les images extraites',
        required: false,
        defaultValue: false,
    }),
    responseFormatZip: Property.Checkbox({
        displayName: 'Format de réponse en ZIP',
        required: false,
        defaultValue: false,
    }),
    startPageId: Property.Number({
        displayName: 'Page de départ',
        required: false,
        defaultValue: 0,
    }),
    endPageId: Property.Number({
        displayName: 'Page de fin',
        required: false,
        defaultValue: 99999,
    }),
    parseMethod: Property.ShortText({
        displayName: 'Méthode de parsing',
        required: false,
        defaultValue: 'auto',
    }),
    langList: Property.ShortText({
        displayName: 'Langue',
        required: false,
        defaultValue: 'ch',
    }),
    serverUrl: Property.ShortText({
        displayName: 'URL du serveur MinerU',
        required: true,
        defaultValue: 'string',
    }),
  },
  async run(context) {
    // Validate the input properties using Zod
    //await propsValidation.validateZod(context.propsValue, {
    //    file: z.string().min(1, 'Le fichier ne peut pas être vide'),
    //    startPageId: z.number().min(0, 'La page de départ doit être au moins 0'),
    //    endPageId: z.number().min(1, 'La page de fin doit être au moins 1').max(99999, 'La page de fin doit être au plus 99999'),
    //    serverUrl: z.string().url("L'adresse du serveur doit être une url valide"),
    //});

    const { file, mimeType, formulaEnable, tableEnable, returnMD, returnMiddleJson, returnModelOutput, returnImages, responseFormatZip, startPageId, endPageId, parseMethod, langList, serverUrl } = context.propsValue;

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
    form.append('start_page_id', String(startPageId));
    form.append('end_page_id', String(endPageId));
    form.append('parse_method', String(parseMethod));
    form.append('lang_list', String(langList));
    form.append('return_md', returnMD ? 'true' : 'false');
    form.append('return_middle_json', returnMiddleJson ? 'true' : 'false');
    form.append('return_model_output', returnModelOutput ? 'true' : 'false');
    form.append('return_images', returnImages ? 'true' : 'false');
    form.append('response_format_zip', responseFormatZip ? 'true' : 'false');
    form.append('formula_enable', formulaEnable ? 'true' : 'false');
    form.append('table_enable', tableEnable ? 'true' : 'false');

    // Envoi vers MinerU
    const response = await fetch(`${serverUrl}/file_parse`, {
        method: 'POST',
        body: form,
    });
    return await response.json();
  },
});
