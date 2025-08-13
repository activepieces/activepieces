import { biginAuth } from '../../index';
import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { companyDropdown, contactsDropdown, layoutsDropdown, multiContactsDropdown, pipelineRecordsDropdown, productsDropdown, SubPipelineorStageDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { formatDateOnly, formatDateTime, handleDropdownError } from '../common/helpers';
import { biginApiService } from '../common/request';

export const createPipelineRecord = createAction({
  auth: biginAuth,
  name: 'createPipeline',
  displayName: 'Create Pipeline',
  description: 'Creates a new pipeline record in Bigin',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Provide the name for the pipeline record (deal)',
      required: true,
    }),
    pipeline: layoutsDropdown(
      'Pipelines',
      'Provide the Team Pipeline to which the pipeline record (deal) belongs',
      'Pipelines'
    ),
    subPipeline: SubPipelineorStageDropdown(
      'Sub Pipeline',
      'Pick one of the configured sub-pipelines',
      'Sub Pipeline'
    ),
    stage: SubPipelineorStageDropdown(
      'Stage',
      'Provide the current stage of the pipeline record (deal) within the Sub-Pipeline',
      'Stage'
    ),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the pipeline record (deal)',
      required: false,
    }),
    secondaryContacts: multiContactsDropdown,
    closingDate: Property.DateTime({
      displayName: 'Closing Date',
      description:
        'Provide the expected or actual closing date of the pipeline record (deal) in YYYY-MM-DD format',
      required: true,
    }),
    owner: usersDropdown,
    accountName: companyDropdown,
    contactName: contactsDropdown,
    associatedProducts: productsDropdown,
    tag: tagsDropdown('Pipelines'),
    additionalFields: Property.DynamicProperties({
      displayName: 'Additional Fields',
      description: 'Optional fields from the Pipelines module',
      refreshers: ['auth'],
      required: false,
      props: async ({ auth }: any): Promise<InputPropertyMap> => {
        if (!auth) return {} as InputPropertyMap;
        const { access_token, api_domain } = auth as any;

        const fieldsResp = await biginApiService.fetchModuleFields(
          access_token,
          api_domain,
          'Pipelines'
        );

        const props: InputPropertyMap = {};
        for (const f of (fieldsResp.fields || []) as any[]) {
          const apiName = f.api_name as string;
          if (
            ['Deal_Name', 'Sub_Pipeline', 'Stage', 'Owner', 'Account_Name', 'Contact_Name', 'Tag', 'Pipeline', 'Associated_Products', 'Secondary_Contacts', 'Closing_Date', 'id'].includes(apiName)
          ) {
            continue;
          }
          if (f.read_only || f.field_read_only) continue;
          if (!f.view_type || f.view_type.create !== true) continue;

          const display = f.display_label || f.field_label || apiName;

          switch ((f.data_type as string)?.toLowerCase()) {
            case 'picklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticDropdown({
                displayName: display,
                required: false,
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
                displayName: display,
                required: false,
                options: { options },
              });
              break;
            }
            case 'boolean': {
              props[apiName] = Property.Checkbox({
                displayName: display,
                required: false,
              });
              break;
            }
            case 'date': {
              props[apiName] = Property.ShortText({
                displayName: display,
                required: false,
              });
              break;
            }
            case 'datetime': {
              props[apiName] = Property.DateTime({
                displayName: display,
                required: false,
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
                displayName: display,
                required: false,
              });
              break;
            }
            default: {
              props[apiName] = Property.ShortText({
                displayName: display,
                required: false,
              });
            }
          }
        }

        return props;
      },
    }),
  },
  async run({ propsValue, auth }) {
    const payload: any = {
      Deal_Name: propsValue.dealName,
      Sub_Pipeline: propsValue.subPipeline,
      Stage: propsValue.stage,
    };

    if (propsValue.owner) payload.Owner = { id: propsValue.owner };
    if (propsValue.accountName)
      payload.Account_Name = { id: propsValue.accountName };
    if (propsValue.contactName)
      payload.Contact_Name = { id: propsValue.contactName };


    if (propsValue.amount) payload.Amount = propsValue.amount;
    if (!propsValue.closingDate) {
      payload.Closing_Date = formatDateOnly(new Date());
    } else {
      payload.Closing_Date = formatDateOnly(propsValue.closingDate);
    }
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

    if (propsValue.additionalFields && typeof propsValue.additionalFields === 'object') {
      for (const [apiName, value] of Object.entries(propsValue.additionalFields as Record<string, any>)) {
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && (value as any[]).length === 0)
        ) {
          continue;
        }
        if (
          ['Deal_Name', 'Sub_Pipeline', 'Stage', 'Owner', 'Account_Name', 'Contact_Name', 'Tag', 'Pipeline', 'Associated_Products', 'Secondary_Contacts', 'Closing_Date'].includes(apiName)
        ) {
          continue;
        }
        payload[apiName] = value;
      }
    }

    try {
      const { access_token, api_domain } = auth as any;

      const response = await biginApiService.createPipelineRecord(
        access_token,
        api_domain,
        { data: [payload] }
      );

      const created = response.data[0];

      if (
        propsValue.secondaryContacts &&
        Array.isArray(propsValue.secondaryContacts) &&
        created?.details?.id
      ) {
        const secondaries = (propsValue.secondaryContacts as any[])
          .map((value: any) => String(value))
          .filter((id: string) => id !== propsValue.contactName);

        if (secondaries.length > 0) {
          await biginApiService.updatePipelineRecord(
            access_token,
            api_domain,
            {
              data: [
                {
                  id: created.details.id,
                  Secondary_Contacts: secondaries.map((id: string) => ({ id })),
                },
              ],
            }
          );
        }
      }

      return created;
    } catch (error) {
      console.error('Error creating pipeline:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create pipeline: ${error.message}`
          : 'Failed to create pipeline due to an unknown error'
      );
    }
  },
});
