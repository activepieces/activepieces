import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders, queryViews } from '../common';

export const downloadView = createAction({
  name: 'download_view',
  displayName: 'Download View',
  description: 'Download a view from a workbook in the specified format',
  auth: tableauAuth,
  props: {
    viewId: Property.Dropdown({
 auth: tableauAuth,      
      displayName: 'View',
      description: 'Select the view to download',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Tableau account first',
          };
        }

        try {
          const views = await queryViews(auth);
          return {
            disabled: false,
            options: views.map((view) => ({
              label: view.name,
              value: view.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load views. Please check your authentication.',
          };
        }
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'The format to download the view in',
      required: true,
      options: {
        options: [
          { label: 'CSV', value: 'csv' },
          { label: 'Image (PNG)', value: 'image' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Excel Crosstab', value: 'excel' },
        ],
      },
    }),
    maxAge: Property.Number({
      displayName: 'Max Age (minutes)',
      description: 'Maximum age of cached data in minutes (default: 60)',
      required: false,
      defaultValue: 60,
    }),
    resolution: Property.ShortText({
      displayName: 'Image Resolution',
      description: 'Resolution for image format (high for maximum pixel density)',
      required: false,
    }),
    vizWidth: Property.Number({
      displayName: 'Visualization Width',
      description: 'Width of the rendered image/PDF in pixels',
      required: false,
    }),
    vizHeight: Property.Number({
      displayName: 'Visualization Height',
      description: 'Height of the rendered image/PDF in pixels',
      required: false,
    }),
    pageType: Property.StaticDropdown({
      displayName: 'Page Type',
      description: 'Page size for PDF format',
      required: false,
      options: {
        options: [
          { label: 'Letter', value: 'Letter' },
          { label: 'Legal', value: 'Legal' },
          { label: 'A4', value: 'A4' },
          { label: 'A3', value: 'A3' },
          { label: 'A5', value: 'A5' },
          { label: 'B5', value: 'B5' },
          { label: 'Executive', value: 'Executive' },
          { label: 'Folio', value: 'Folio' },
          { label: 'Ledger', value: 'Ledger' },
          { label: 'Note', value: 'Note' },
          { label: 'Quarto', value: 'Quarto' },
          { label: 'Tabloid', value: 'Tabloid' },
        ],
      },
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      description: 'Page orientation for PDF format',
      required: false,
      options: {
        options: [
          { label: 'Portrait', value: 'Portrait' },
          { label: 'Landscape', value: 'Landscape' },
        ],
      },
    }),
  },
  async run({ auth, propsValue, files }) {
    const { viewId, format, maxAge = 60, resolution, vizWidth, vizHeight, pageType, orientation } = propsValue;
    const tableauAuth = auth as any;

    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    let downloadUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, `views/${viewId}`);

    const queryParams = new URLSearchParams();

    if (maxAge && maxAge > 0) {
      queryParams.append('maxAge', maxAge.toString());
    }

    switch (format) {
      case 'csv':
        downloadUrl += '/data';
        break;
      case 'image':
        downloadUrl += '/image';
        if (resolution) {
          queryParams.append('resolution', resolution);
        }
        if (vizWidth && vizHeight) {
          queryParams.append('vizWidth', vizWidth.toString());
          queryParams.append('vizHeight', vizHeight.toString());
        }
        break;
      case 'pdf':
        downloadUrl += '/pdf';
        if (vizWidth && vizHeight) {
          queryParams.append('vizWidth', vizWidth.toString());
          queryParams.append('vizHeight', vizHeight.toString());
        }
        if (pageType) {
          queryParams.append('type', pageType);
        }
        if (orientation) {
          queryParams.append('orientation', orientation);
        }
        break;
      case 'excel':
        downloadUrl += '/crosstab/excel';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const queryString = queryParams.toString();
    if (queryString) {
      downloadUrl += `?${queryString}`;
    }

    const downloadResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
      headers: {
        'X-Tableau-Auth': authToken,
      },
    });

    if (downloadResponse.status !== 200) {
      throw new Error(`Download failed: ${downloadResponse.status} - ${downloadResponse.body}`);
    }

    let fileExtension: string;

    switch (format) {
      case 'csv':
        fileExtension = 'csv';
        break;
      case 'image':
        fileExtension = 'png';
        break;
      case 'pdf':
        fileExtension = 'pdf';
        break;
      case 'excel':
        fileExtension = 'xlsx';
        break;
      default:
        fileExtension = 'bin';
    }

    const fileName = `tableau_view_${viewId}.${fileExtension}`;

    let fileData: Buffer;
    if (Buffer.isBuffer(downloadResponse.body)) {
      fileData = downloadResponse.body;
    } else if (typeof downloadResponse.body === 'string') {
      fileData = Buffer.from(downloadResponse.body);
    } else {
      fileData = Buffer.from(JSON.stringify(downloadResponse.body));
    }

    const fileUrl = await files.write({
      fileName: fileName,
      data: fileData,
    });

    return {
      success: true,
      fileName: fileName,
      fileUrl: fileUrl,
      format: format,
      size: fileData.length,
    };
  },
});
