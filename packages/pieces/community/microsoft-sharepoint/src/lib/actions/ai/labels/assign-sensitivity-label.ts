import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointAssignSensitivityLabelOutputSchema } from '../../../output-schemas';

export const assignSensitivityLabelAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_assign_sensitivity_label',
  outputSchema: microsoftSharepointAssignSensitivityLabelOutputSchema,
  displayName: 'Assign Sensitivity Label',
  description: 'Starts assigning a sensitivity label to a file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts assigning a Purview sensitivity label to a file; Microsoft applies it in the background and this returns the monitor URL without waiting. Use Extract Sensitivity Labels afterwards to check the label on the file. A protected, metered Microsoft API: the app registration needs Microsoft approval and billing set up. Downgrading a label needs a justification.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    sensitivityLabelId: Property.ShortText({
      displayName: 'Sensitivity Label ID',
      description: 'ID (a GUID) of the sensitivity label to assign, from Microsoft Purview or Extract Sensitivity Labels.',
      required: true,
    }),
    assignmentMethod: Property.StaticDropdown({
      displayName: 'Assignment Method',
      description: 'How the label is assigned: "standard", "privileged" (as an administrator) or "auto". Microsoft uses "standard" when unset.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Privileged', value: 'privileged' },
          { label: 'Auto', value: 'auto' },
        ],
      },
    }),
    justificationText: Property.LongText({
      displayName: 'Justification',
      description: 'Reason recorded for audit. Required when replacing a label with a lower one.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { assignmentMethod, justificationText } = propsValue;
    if (assignmentMethod && !ASSIGNMENT_METHODS.includes(assignmentMethod)) {
      throw new Error('Assignment Method must be "standard", "privileged" or "auto".');
    }
    const response = await microsoftSharePointClient.postRaw({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/assignSensitivityLabel`,
      body: {
        sensitivityLabelId: propsValue.sensitivityLabelId,
        ...(assignmentMethod ? { assignmentMethod } : {}),
        ...(justificationText ? { justificationText } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(
        `Assign Sensitivity Label failed with status ${response.status}: ${await response.text()}`
      );
    }
    return {
      status: response.status,
      monitorUrl: response.headers.get('Location'),
    };
  },
});

const ASSIGNMENT_METHODS = ['standard', 'privileged', 'auto'];
