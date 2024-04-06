import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import { Observable } from 'rxjs';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { RefreshablePropertyCoreControlComponent } from '../refreshable-property-core/refreshable-property-core-control.component';
import { UntypedFormGroup } from '@angular/forms';
import { StepMetaDataForMentions } from '@activepieces/ui/feature-builder-store';
@Component({
  selector: 'app-dynamic-property-control',
  template: `
    @if((loading$ | async) === false) { @if(properties$ | async; as props){

    <app-piece-properties-form
      [stepName]="stepName"
      actionOrTriggerName=""
      [form]="passedFormControl"
      [allConnectionsForPiece]="[]"
      [pieceMetaData]="pieceMetaData"
      [input]="input"
      [customizedInputs]="customizedInputs || {}"
      [flow]="flow"
      [webhookPrefix]="webhookPrefix"
      [formPieceTriggerPrefix]="formPieceTriggerPrefix"
      [propertiesMap]="props"
      (customizedInputsChanged)="customizedInputsChangedHandler($event)"
      [hideCustomizedInputs]="hideCustomizedInputs"
      [stepMetaDataForMentions]="stepMetaDataForMentions"
    ></app-piece-properties-form>
    } } @else(){
    <div
      class="ap-flex ap-flex-grow ap-justify-center ap-items-center ap-h-[250px]"
    >
      <ap-loading-icon> </ap-loading-icon>
    </div>
    } @if(properties$ | async){} @if(resetValueOnRefresherChange$ | async){}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropertyControlComponent
  extends RefreshablePropertyCoreControlComponent
  implements OnInit
{
  @Input({ required: true }) passedFormControl: UntypedFormGroup;
  @Input({ required: true }) stepName: string;
  @Input({ required: true }) webhookPrefix: string;
  @Input({ required: true }) formPieceTriggerPrefix: string;
  @Input({ required: true }) propertiesMap: PiecePropertyMap;
  @Input({ required: true }) input: Record<string, any> = {};
  @Input({ required: true }) customizedInputs: Record<string, boolean> = {};
  @Input({ required: true }) hideCustomizedInputs = false;
  properties$?: Observable<PiecePropertyMap>;
  @Output() customizedInputsChanged = new EventEmitter<{
    propertyName: string;
    value: boolean;
  }>();
  @Input({ required: true })
  stepMetaDataForMentions: StepMetaDataForMentions[] = [];
  readonly PropertyType = PropertyType;
  constructor(piecetaDataService: PieceMetadataService) {
    super(piecetaDataService);
  }
  ngOnInit() {
    this.properties$ = this.createRefreshers<PiecePropertyMap>();
  }
  override refreshersChanged() {
    //if emit event is true each control removal will result in a save request
    Object.keys(this.passedFormControl.controls).forEach((ctrlName) => {
      this.passedFormControl.removeControl(ctrlName, { emitEvent: false });
    });
    this.passedFormControl.setValue({});
  }

  customizedInputsChangedHandler(newValue: {
    propertyName: string;
    value: boolean;
  }) {
    this.customizedInputsChanged.emit(newValue);
  }
}
