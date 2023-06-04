import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActionMetaService } from '../../../service/action-meta.service';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { Observable, map } from 'rxjs';
import { TriggerType } from '@activepieces/shared';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'ap-template-apps-dropdown',
  templateUrl: './template-apps-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TemplateAppsDropdownComponent,
    },
  ],
})
export class TemplateAppsDropdownComponent implements ControlValueAccessor {
  pieces$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'>[]
  >;
  piecesToShowInDropdown$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'>[]
  >;
  selectedPieces: string[] = [];
  dropdownControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  onChange: (val: Array<string>) => void = () => {
    //ignored
  };
  constructor(private actionMetaDataService: ActionMetaService) {
    this.pieces$ = this.actionMetaDataService.getPiecesManifest().pipe(
      map((pieces) => {
        const coreSteps = [
          ...this.actionMetaDataService.triggerItemsDetails.filter(
            (d) => d.type !== TriggerType.EMPTY
          ),
          ...this.actionMetaDataService.coreFlowItemsDetails,
        ].map((detail) => {
          const nonePieceDetials =
            this.actionMetaDataService.findNonPieceStepIcon(detail.type);
          return {
            displayName: detail.name,
            logoUrl: nonePieceDetials.url,
            name: nonePieceDetials.key,
          };
        });

        const result = [...coreSteps, ...pieces];
        // sort result by display name
        result.sort((a, b) => {
          return a.displayName.localeCompare(b.displayName) > -1 ? 1 : -1;
        });
        return result;
      })
    );
    this.setPiecesToShowInDropdown();
  }
  writeValue(): void {
    //ignored
  }
  registerOnChange(fn: (val: Array<string>) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(): void {
    //ignored
  }
  setDisabledState?(): void {
    //ignored
  }
  addPieceToFilter(pieceName: string) {
    this.selectedPieces.push(pieceName);
    this.dropdownControl.setValue('');
    this.setPiecesToShowInDropdown();
    this.onChange(this.selectedPieces);
  }
  removePieceFromFilter(pieceName: string) {
    this.selectedPieces = this.selectedPieces.filter((p) => p !== pieceName);
    this.setPiecesToShowInDropdown();
    this.onChange(this.selectedPieces);
  }

  private setPiecesToShowInDropdown() {
    this.piecesToShowInDropdown$ = this.pieces$.pipe(
      map((pieces) => {
        return pieces.filter((p) => !this.selectedPieces.includes(p.name));
      })
    );
  }
}
