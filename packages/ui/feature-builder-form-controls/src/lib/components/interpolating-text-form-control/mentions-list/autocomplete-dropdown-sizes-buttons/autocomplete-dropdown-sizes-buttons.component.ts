import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BuilderAutocompleteMentionsDropdownService } from '@activepieces/ui/common';

@Component({
  selector: 'app-autocomplete-dropdown-sizes-buttons',
  templateUrl: './autocomplete-dropdown-sizes-buttons.component.html',
  styleUrls: ['./autocomplete-dropdown-sizes-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteDropdownSizesButtonsComponent {
  constructor(
    public builderAutocompleteService: BuilderAutocompleteMentionsDropdownService
  ) {}
}
