import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { companyDropdown, contactsDropdown, layoutsDropdown, multiContactsDropdown, pipelineRecordsDropdown, productsDropdown, SubPipelineorStageDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { formatDateOnly } from '../common/helpers';

export const updatePipelineRecord = createAction({
  auth: biginAuth,
  name: 'updatePipeline',
  displayName: 'Update Pipeline',
  description: 'updates a pipeline record in Bigin',
  props: {
    pipelineRecordId: pipelineRecordsDropdown,
    pipelineDetails: Property.DynamicProperties({
      displayName: 'Pipeline Details',
      description: 'These fields will be prepopulated with pipeline data',
      refreshers: ['pipelineRecordId', 'auth'],
      required: true,
      props: async ({ pipelineRecordId, auth }: any) => {
        const pipelineData = JSON.parse(pipelineRecordId);
        const pipelineId = pipelineData.id;
        if (!pipelineId) {
          throw new Error('Pipeline ID is required to update the record');
        }

        const { access_token, api_domain } = auth as any;
        const fieldsResp = await biginApiService.fetchModuleFields(
          access_token,
          api_domain,
          'Pipelines'
        );

        const props: any = {};
        for (const f of (fieldsResp.fields || []) as any[]) {
          const apiName = f.api_name as string;
          if (f.read_only || f.field_read_only) continue;
          if (!f.view_type || f.view_type.edit !== true) continue;
          if (apiName === 'Tag' || apiName === 'id' || apiName === 'Secondary_Contacts') continue;

          const defaultValue = pipelineData[apiName] ?? undefined;
          switch ((f.data_type as string)?.toLowerCase()) {
            case 'picklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticDropdown({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
                options: { options },
              });
              break;
            }
            case 'multiselectpicklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticMultiSelectDropdown({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
                options: { options },
              });
              break;
            }
            case 'boolean': {
              props[apiName] = Property.Checkbox({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue: Boolean(defaultValue),
              });
              break;
            }
            case 'date': {
              props[apiName] = Property.ShortText({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || 'Format: YYYY-MM-DD',
                required: false,
                defaultValue,
              });
              break;
            }
            case 'datetime': {
              props[apiName] = Property.DateTime({
                displayName: f.display_label || f.field_label || apiName,
                description:
                  f.tooltip || 'Format: ISO 8601 (YYYY-MM-DDTHH:mm:ss±HH:mm)',
                required: false,
                defaultValue,
              });
              break;
            }
            case 'integer':
            case 'long':
            case 'double':
            case 'decimal':
            case 'currency':
            case 'percent': {
              props[apiName] = Property.Number({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
              });
              break;
            }
            default: {
              props[apiName] = Property.ShortText({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined,
              });
            }
          }
        }

        return props;
      },
    }),
    pipeline: layoutsDropdown(
      'Pipelines',
      'Provide the Team Pipeline to which the pipeline record (deal) belongs',
      'Pipelines'
    ),
    subPipeline: SubPipelineorStageDropdown(
      'Sub Pipeline',
      'Pick one of the configured sub-pipelines',
      'Sub Pipeline',
    ),
    stage: SubPipelineorStageDropdown(
      'Stage',
      'Provide the current stage of the pipeline record (deal) within the Sub-Pipeline',
      'Stage',
    ),
    owner: usersDropdown,
    accountName: companyDropdown,
    contactName: contactsDropdown,
    secondaryContacts: multiContactsDropdown,
    associatedProducts: productsDropdown,
    tag: tagsDropdown('Pipelines'),
  },
  async run({propsValue, auth}) {
    const pipelineData = JSON.parse(propsValue.pipelineRecordId as string);

    const payload: any = {
      id: pipelineData.id,
    };

    if (propsValue.owner) payload.Owner = propsValue.owner;
    if (propsValue.accountName)
      payload.Account_Name = { id: propsValue.accountName };
    if (propsValue.contactName)
      payload.Contact_Name = { id: propsValue.contactName };

    if (propsValue.subPipeline)
      payload['Sub Pipeline'] = propsValue.subPipeline;

    if (propsValue.stage) payload.Stage = propsValue.stage;
    if (propsValue.pipelineDetails['dealName']) payload.Deal_Name = propsValue.pipelineDetails['dealName'];


    if (propsValue.pipelineDetails['amount']) payload.Amount = propsValue.pipelineDetails['amount'];
    if (propsValue.pipelineDetails['closingDate'])
      payload.Closing_Date = formatDateOnly(
        propsValue.pipelineDetails['closingDate']
      );
    if (propsValue.pipeline) {
      const pipeline = JSON.parse(propsValue.pipeline as any);
      payload.Pipeline = { id: pipeline.id, name: pipeline.name };
    }

    if (propsValue.associatedProducts) {
      payload.Associated_Products = propsValue.associatedProducts.map(
        (product: any) => {
          const p = JSON.parse(product);
          return { id: p.id, name: p.name };
        }
      );
    }
    if (propsValue.tag) {
      payload.Tag = propsValue.tag.map((t: any) => ({ name: t }));
    }
    
    const {access_token, api_domain} = auth as any;

   try {
      const response = await biginApiService.updatePipelineRecord(
       access_token,
       api_domain,
       { data: [payload] }
     );

      if (
        propsValue.secondaryContacts &&
        Array.isArray(propsValue.secondaryContacts)
      ) {
        const secondaries = (propsValue.secondaryContacts as any[])
          .map((v: any) => String(v))
          .filter((id: string) => id !== propsValue.contactName);

        if (secondaries.length > 0) {
          await biginApiService.updatePipelineRecord(
            access_token,
            api_domain,
            {
              data: [
                {
                  id: pipelineData.id,
                  Secondary_Contacts: secondaries.map((id: string) => ({ id })),
                },
              ],
            }
          );
        }
      }

      return {
        message: 'Pipeline record updated successfully',
        pipelineRecord: response.data[0],
      };
   } catch (error: any) {
     console.error('Error updating pipeline record:', error);
     throw new Error(error);
   }
  },
});
