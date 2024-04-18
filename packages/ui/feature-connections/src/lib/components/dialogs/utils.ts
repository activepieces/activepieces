import { AppConnectionsService } from '@activepieces/ui/common';
import { FormControl, Validators } from '@angular/forms';
import { ConnectionValidator } from '../../validators/connectionNameValidator';
import { connectionNameRegex } from '@activepieces/shared';
export const createConnectionNameControl = ({
  appConnectionsService,
  pieceName,
  existingConnectionName,
}: {
  appConnectionsService: AppConnectionsService;
  pieceName: string;
  existingConnectionName?: string;
}) => {
  return new FormControl(
    {
      value:
        existingConnectionName ??
        appConnectionsService.getConnectionNameSuggest(pieceName),
      disabled: !!existingConnectionName,
    },
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
