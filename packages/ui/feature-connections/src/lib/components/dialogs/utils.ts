import { AppConnectionsService } from '@activepieces/ui/common';
import { FormControl, Validators } from '@angular/forms';
import { ConnectionValidator } from '../../validators/connectionNameValidator';

export const connectionNameRegex = '[A-Za-z0-9_\\-@\\+\\.]*';
export const createConnectionNameControl = (
  appConnectionsService: AppConnectionsService,
  pieceName: string
) => {
  return new FormControl(
    appConnectionsService.getConnectionNameSuggest(pieceName),
    {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(connectionNameRegex),
      ],
      asyncValidators: [
        ConnectionValidator.createValidator(
          appConnectionsService.getAllOnce(),
          undefined
        ),
      ],
    }
  );
};
