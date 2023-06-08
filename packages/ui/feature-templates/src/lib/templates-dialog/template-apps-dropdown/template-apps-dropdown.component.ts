import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ActionMetaService,
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  corePieceIconUrl,
} from '@activepieces/ui/common';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { Observable, map, tap } from 'rxjs';
import { TriggerType } from '@activepieces/shared';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-template-apps-dropdown',
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
  valueChanges$: Observable<string>;
  onChange: (val: Array<string>) => void = () => {
    //ignored
  };
  constructor(private actionMetaDataService: ActionMetaService) {
    this.valueChanges$ = this.dropdownControl.valueChanges.pipe(
      tap((val) => {
        this.addPieceToFilter(val);
        this.dropdownControl.setValue('', { emitEvent: false });
      })
    );
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
        const result = [
          ...coreSteps,
          ...pieces.map((p) => {
            if (
              CORE_PIECES_ACTIONS_NAMES.find((n) => p.name === n) ||
              CORE_PIECES_TRIGGERS.find((n) => p.name === n)
            ) {
              console.log(p.name);
              return {
                ...p,
                logoUrl: corePieceIconUrl(p.name),
              };
            }
            return p;
          }),
        ];
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
    this.dropdownControl.setValue('', { emitEvent: false });
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
