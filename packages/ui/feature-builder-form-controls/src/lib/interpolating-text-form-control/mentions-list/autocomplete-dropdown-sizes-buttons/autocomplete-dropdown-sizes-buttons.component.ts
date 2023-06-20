import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BuilderAutocompleteMentionsDropdownService } from '../../builder-autocomplete-mentions-dropdown/builder-autocomplete-mentions-dropdown.service';

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
