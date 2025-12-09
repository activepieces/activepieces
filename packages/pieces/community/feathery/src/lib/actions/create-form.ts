import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

export const createFormAction = createAction({
  auth: featheryAuth,
  name: 'create_form',
  displayName: 'Create Form',
  description: 'Create a form based on an existing template form.',
  props: {
    form_name: Property.ShortText({
      displayName: 'Form Name',
      description: 'The name of the new form (must be unique).',
      required: true,
    }),
    template_form_id: Property.Dropdown({
      displayName: 'Template Form',
      description: 'Select the template form to copy from.',
      required: true,
      refreshers: [],
      auth: featheryAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const forms = await featheryCommon.apiCall<
          Array<{ id: string; name: string; active: boolean }>
        >({
          method: HttpMethod.GET,
          url: '/form/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: forms.map((form) => ({
            label: form.name,
            value: form.id,
          })),
        };
      },
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the created form should be enabled. If not set, inherits from template.',
      required: false,
    }),
    steps: Property.Array({
      displayName: 'Steps',
      description: 'Define the steps for your form.',
      required: true,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'Unique ID for this step.',
          required: true,
        }),
        template_step_id: Property.ShortText({
          displayName: 'Template Step ID',
          description: 'ID of the step to copy from the template. Leave empty to auto-create.',
          required: false,
        }),
        origin: Property.Checkbox({
          displayName: 'Is First Step',
          description: 'Set to true if this is the first step of the form.',
          required: false,
        }),
      },
    }),
    step_images: Property.Array({
      displayName: 'Step Images',
      description: 'Edit image elements on steps.',
      required: false,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'The step containing this image.',
          required: true,
        }),
        id: Property.ShortText({
          displayName: 'Image Element ID',
          description: 'ID of the image element to edit.',
          required: true,
        }),
        source_url: Property.ShortText({
          displayName: 'Image URL',
          description: 'New image URL.',
          required: false,
        }),
        asset: Property.ShortText({
          displayName: 'Asset Name',
          description: 'Name of the image asset from the template theme.',
          required: false,
        }),
      },
    }),
    step_videos: Property.Array({
      displayName: 'Step Videos',
      description: 'Edit video elements on steps.',
      required: false,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'The step containing this video.',
          required: true,
        }),
        id: Property.ShortText({
          displayName: 'Video Element ID',
          description: 'ID of the video element to edit.',
          required: true,
        }),
        source_url: Property.ShortText({
          displayName: 'Video URL',
          description: 'New video URL.',
          required: false,
        }),
        asset: Property.ShortText({
          displayName: 'Asset Name',
          description: 'Name of the video asset from the template theme.',
          required: false,
        }),
      },
    }),
    step_texts: Property.Array({
      displayName: 'Step Texts',
      description: 'Edit text elements on steps.',
      required: false,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'The step containing this text element.',
          required: true,
        }),
        id: Property.ShortText({
          displayName: 'Text Element ID',
          description: 'ID of the text element to edit.',
          required: true,
        }),
        text: Property.LongText({
          displayName: 'Text',
          description: 'New text to display.',
          required: false,
        }),
        asset: Property.ShortText({
          displayName: 'Asset Name',
          description: 'Name of the text asset from the template theme.',
          required: false,
        }),
      },
    }),
    step_buttons: Property.Array({
      displayName: 'Step Buttons',
      description: 'Edit button elements on steps.',
      required: false,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'The step containing this button.',
          required: true,
        }),
        id: Property.ShortText({
          displayName: 'Button Element ID',
          description: 'ID of the button to edit.',
          required: true,
        }),
        text: Property.ShortText({
          displayName: 'Button Text',
          description: 'Text to display on the button.',
          required: false,
        }),
        asset: Property.ShortText({
          displayName: 'Asset Name',
          description: 'Name of the button asset from the template theme.',
          required: false,
        }),
      },
    }),
    step_progress_bars: Property.Array({
      displayName: 'Step Progress Bars',
      description: 'Edit progress bar elements on steps.',
      required: false,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'The step containing this progress bar.',
          required: true,
        }),
        id: Property.ShortText({
          displayName: 'Progress Bar ID',
          description: 'ID of the progress bar to edit.',
          required: true,
        }),
        progress: Property.Number({
          displayName: 'Progress',
          description: 'Progress percentage (0-100).',
          required: false,
        }),
        asset: Property.ShortText({
          displayName: 'Asset Name',
          description: 'Name of the progress bar asset from the template theme.',
          required: false,
        }),
      },
    }),
    step_fields: Property.Array({
      displayName: 'Step Fields',
      description: 'Edit field elements on steps.',
      required: false,
      properties: {
        step_id: Property.ShortText({
          displayName: 'Step ID',
          description: 'The step containing this field.',
          required: true,
        }),
        id: Property.ShortText({
          displayName: 'Field Element ID',
          description: 'ID of the field to copy.',
          required: true,
        }),
        field_id: Property.ShortText({
          displayName: 'New Field ID',
          description: 'ID to set for the field. Links to existing field data if ID exists.',
          required: false,
        }),
        type: Property.StaticDropdown({
          displayName: 'Field Type',
          description: 'Type of the field.',
          required: false,
          options: {
            options: [
              { label: 'Text Field', value: 'text_field' },
              { label: 'Text Area', value: 'text_area' },
              { label: 'Integer Field', value: 'integer_field' },
              { label: 'Email', value: 'email' },
              { label: 'Phone Number', value: 'phone_number' },
              { label: 'Dropdown', value: 'dropdown' },
              { label: 'Select', value: 'select' },
              { label: 'Multiselect', value: 'multiselect' },
              { label: 'Checkbox', value: 'checkbox' },
              { label: 'Date', value: 'date' },
              { label: 'File Upload', value: 'file_upload' },
              { label: 'Button Group', value: 'button_group' },
              { label: 'URL', value: 'url' },
              { label: 'SSN', value: 'ssn' },
              { label: 'Pin Input', value: 'pin_input' },
              { label: 'Hex Color', value: 'hex_color' },
              { label: 'Login', value: 'login' },
              { label: 'Google Maps Line 1', value: 'gmap_line_1' },
              { label: 'Google Maps Line 2', value: 'gmap_line_2' },
              { label: 'Google Maps City', value: 'gmap_city' },
              { label: 'Google Maps State', value: 'gmap_state' },
              { label: 'Google Maps Zip', value: 'gmap_zip' },
            ],
          },
        }),
        description: Property.ShortText({
          displayName: 'Label',
          description: 'Label/description of the field.',
          required: false,
        }),
        required: Property.Checkbox({
          displayName: 'Required',
          description: 'Whether the field is required.',
          required: false,
        }),
        placeholder: Property.ShortText({
          displayName: 'Placeholder',
          description: 'Placeholder text for the field.',
          required: false,
        }),
        tooltipText: Property.ShortText({
          displayName: 'Tooltip Text',
          description: 'Tooltip text for the field.',
          required: false,
        }),
        max_length: Property.Number({
          displayName: 'Max Length',
          description: 'Maximum length of the field value.',
          required: false,
        }),
        min_length: Property.Number({
          displayName: 'Min Length',
          description: 'Minimum length of the field value.',
          required: false,
        }),
        submit_trigger: Property.StaticDropdown({
          displayName: 'Submit Trigger',
          description: 'Does filling out this field trigger step submission?',
          required: false,
          options: {
            options: [
              { label: 'None', value: 'none' },
              { label: 'Auto', value: 'auto' },
            ],
          },
        }),
        asset: Property.ShortText({
          displayName: 'Asset Name',
          description: 'Name of the field asset from the template theme.',
          required: false,
        }),
      },
    }),
    navigation_rules: Property.Array({
      displayName: 'Navigation Rules',
      description: 'Define how users navigate between steps.',
      required: false,
      properties: {
        previous_step_id: Property.ShortText({
          displayName: 'From Step ID',
          description: 'The step the user is coming from.',
          required: true,
        }),
        next_step_id: Property.ShortText({
          displayName: 'To Step ID',
          description: 'The step the user is going to.',
          required: true,
        }),
        trigger: Property.StaticDropdown({
          displayName: 'Trigger',
          description: 'How navigation is triggered.',
          required: true,
          options: {
            options: [
              { label: 'Click', value: 'click' },
              { label: 'Change', value: 'change' },
              { label: 'Load', value: 'load' },
            ],
          },
        }),
        element_type: Property.StaticDropdown({
          displayName: 'Element Type',
          description: 'Type of element that triggers navigation.',
          required: true,
          options: {
            options: [
              { label: 'Button', value: 'button' },
              { label: 'Field', value: 'field' },
              { label: 'Text', value: 'text' },
            ],
          },
        }),
        element_id: Property.ShortText({
          displayName: 'Element ID',
          description: 'ID of the element that triggers navigation.',
          required: true,
        }),
      },
    }),
    navigation_conditions: Property.Array({
      displayName: 'Navigation Conditions',
      description: 'Conditions for navigation rules. Reference the navigation rule by its index (0-based).',
      required: false,
      properties: {
        rule_index: Property.Number({
          displayName: 'Rule Index',
          description: 'Index of the navigation rule (0 for first rule, 1 for second, etc.).',
          required: true,
        }),
        comparison: Property.StaticDropdown({
          displayName: 'Comparison',
          description: 'Type of comparison.',
          required: true,
          options: {
            options: [
              { label: 'Equal', value: 'equal' },
              { label: 'Not Equal', value: 'not_equal' },
            ],
          },
        }),
        field_key: Property.ShortText({
          displayName: 'Field Key',
          description: 'ID of the field to compare.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Value to compare against.',
          required: true,
        }),
      },
    }),
    logic_rules: Property.Array({
      displayName: 'Logic Rules',
      description: 'Advanced logic rules for the form.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Rule Name',
          description: 'Name of the logic rule.',
          required: true,
        }),
        code: Property.LongText({
          displayName: 'JavaScript Code',
          description: 'JavaScript code to run.',
          required: true,
        }),
        trigger_event: Property.StaticDropdown({
          displayName: 'Trigger Event',
          description: 'Event that triggers the rule.',
          required: true,
          options: {
            options: [
              { label: 'Change', value: 'change' },
              { label: 'Load', value: 'load' },
              { label: 'Form Complete', value: 'form_complete' },
              { label: 'Submit', value: 'submit' },
              { label: 'Error', value: 'error' },
              { label: 'View', value: 'view' },
              { label: 'Action', value: 'action' },
            ],
          },
        }),
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the logic rule.',
          required: false,
        }),
        index: Property.Number({
          displayName: 'Execution Order',
          description: 'Order in which this rule executes.',
          required: false,
        }),
        steps_csv: Property.ShortText({
          displayName: 'Steps (comma-separated)',
          description: 'Step IDs that trigger the rule (for submit/load events). Separate with commas.',
          required: false,
        }),
        elements_csv: Property.ShortText({
          displayName: 'Elements (comma-separated)',
          description: 'Element IDs that trigger the rule (for change/error/view/action events). Separate with commas.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      form_name,
      template_form_id,
      enabled,
      steps,
      step_images,
      step_videos,
      step_texts,
      step_buttons,
      step_progress_bars,
      step_fields,
      navigation_rules,
      navigation_conditions,
      logic_rules,
    } = context.propsValue;

    const stepsMap = new Map<string, any>();

    for (const step of steps as any[]) {
      stepsMap.set(step.step_id, {
        step_id: step.step_id,
        ...(step.template_step_id && { template_step_id: step.template_step_id }),
        ...(step.origin && { origin: step.origin }),
        images: [],
        videos: [],
        texts: [],
        buttons: [],
        progress_bars: [],
        fields: [],
      });
    }

    if (step_images && Array.isArray(step_images)) {
      for (const img of step_images as any[]) {
        const step = stepsMap.get(img.step_id);
        if (step) {
          step.images.push({
            id: img.id,
            ...(img.source_url && { source_url: img.source_url }),
            ...(img.asset && { asset: img.asset }),
          });
        }
      }
    }

    if (step_videos && Array.isArray(step_videos)) {
      for (const video of step_videos as any[]) {
        const step = stepsMap.get(video.step_id);
        if (step) {
          step.videos.push({
            id: video.id,
            ...(video.source_url && { source_url: video.source_url }),
            ...(video.asset && { asset: video.asset }),
          });
        }
      }
    }

    if (step_texts && Array.isArray(step_texts)) {
      for (const txt of step_texts as any[]) {
        const step = stepsMap.get(txt.step_id);
        if (step) {
          step.texts.push({
            id: txt.id,
            ...(txt.text && { text: txt.text }),
            ...(txt.asset && { asset: txt.asset }),
          });
        }
      }
    }

    if (step_buttons && Array.isArray(step_buttons)) {
      for (const btn of step_buttons as any[]) {
        const step = stepsMap.get(btn.step_id);
        if (step) {
          step.buttons.push({
            id: btn.id,
            ...(btn.text && { text: btn.text }),
            ...(btn.asset && { asset: btn.asset }),
          });
        }
      }
    }

    if (step_progress_bars && Array.isArray(step_progress_bars)) {
      for (const pb of step_progress_bars as any[]) {
        const step = stepsMap.get(pb.step_id);
        if (step) {
          step.progress_bars.push({
            id: pb.id,
            ...(pb.progress !== undefined && { progress: pb.progress }),
            ...(pb.asset && { asset: pb.asset }),
          });
        }
      }
    }

    if (step_fields && Array.isArray(step_fields)) {
      for (const field of step_fields as any[]) {
        const step = stepsMap.get(field.step_id);
        if (step) {
          step.fields.push({
            id: field.id,
            ...(field.field_id && { field_id: field.field_id }),
            ...(field.type && { type: field.type }),
            ...(field.description && { description: field.description }),
            ...(field.required !== undefined && { required: field.required }),
            ...(field.placeholder && { placeholder: field.placeholder }),
            ...(field.tooltipText && { tooltipText: field.tooltipText }),
            ...(field.max_length !== undefined && { max_length: field.max_length }),
            ...(field.min_length !== undefined && { min_length: field.min_length }),
            ...(field.submit_trigger && { submit_trigger: field.submit_trigger }),
            ...(field.asset && { asset: field.asset }),
          });
        }
      }
    }

    const navRulesArray: any[] = [];
    if (navigation_rules && Array.isArray(navigation_rules)) {
      for (const rule of navigation_rules as any[]) {
        navRulesArray.push({
          previous_step_id: rule.previous_step_id,
          next_step_id: rule.next_step_id,
          trigger: rule.trigger,
          element_type: rule.element_type,
          element_id: rule.element_id,
          rules: [],
        });
      }
    }

    if (navigation_conditions && Array.isArray(navigation_conditions)) {
      for (const cond of navigation_conditions as any[]) {
        const ruleIndex = cond.rule_index;
        if (ruleIndex >= 0 && ruleIndex < navRulesArray.length) {
          navRulesArray[ruleIndex].rules.push({
            comparison: cond.comparison,
            field_key: cond.field_key,
            value: cond.value,
          });
        }
      }
    }

    const logicRulesArray: any[] = [];
    if (logic_rules && Array.isArray(logic_rules)) {
      for (const rule of logic_rules as any[]) {
        logicRulesArray.push({
          name: rule.name,
          code: rule.code,
          trigger_event: rule.trigger_event,
          ...(rule.description && { description: rule.description }),
          ...(rule.index !== undefined && { index: rule.index }),
          ...(rule.steps_csv && { steps: rule.steps_csv.split(',').map((s: string) => s.trim()) }),
          ...(rule.elements_csv && { elements: rule.elements_csv.split(',').map((s: string) => s.trim()) }),
        });
      }
    }

    const body: any = {
      form_name,
      template_form_id,
      steps: Array.from(stepsMap.values()),
      navigation_rules: navRulesArray,
    };

    if (enabled !== undefined) {
      body.enabled = enabled;
    }

    if (logicRulesArray.length > 0) {
      body.logic_rules = logicRulesArray;
    }

    const response = await featheryCommon.apiCall<{
      id: string;
      name: string;
      internal_id?: string;
    }>({
      method: HttpMethod.POST,
      url: '/form/',
      apiKey: context.auth.secret_text,
      body,
    });

    return response;
  },
});

