import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import { UiCommonModule } from '@activepieces/ui/common';
import { DynamicInputToggleComponent } from '../dynamic-input-toggle/dynamic-input-toggle.component';
import { DropdownSearchControlComponent } from '../dropdown-search-control/dropdown-search-control.component';
import { DropdownSelectedValuesPipe } from '../pipes/dropdown-selected-values.pipe';
import { Observable } from 'rxjs';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { DropdownLabelsJoiner } from '../pipes/dropdown-labels-joiner.pipe';
import { RefreshablePropertyCoreControlComponent } from '../refreshable-property-core/refreshable-property-core-control.component';
@Component({
  selector: 'app-dynamic-property-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    DynamicInputToggleComponent,
    DropdownSearchControlComponent,
    DropdownSelectedValuesPipe,
    DropdownLabelsJoiner,
  ],
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefreshableDropdownControlComponent
  extends RefreshablePropertyCoreControlComponent
  implements OnInit
{
  properties$?: Observable<PiecePropertyMap>;
  readonly PropertyType = PropertyType;
  constructor(piecetaDataService: PieceMetadataService) {
    super(piecetaDataService);
  }
  ngOnInit() {
    this.properties$ = this.createRefreshers();
  }
}
