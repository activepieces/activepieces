import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  DropdownOption,
  PieceMetadataModel,
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  getPropertyInitialValue,
  jsonValidator,
} from '@activepieces/ui/common';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, distinctUntilChanged, tap } from 'rxjs';
import deepEqual from 'deep-equal';
import { PopulatedFlow } from '@activepieces/shared';
import { createFormControlsWithTheirValidators } from './properties-controls-helper';
import { ControlThatUsesMentionsCoreComponent } from '../control-that-uses-mentions-core/control-that-uses-mentions-core.component';

@Component({
  selector: 'app-piece-properties-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './piece-properties-form.component.html',
})
export class PiecePropertiesFormComponent
  extends ControlThatUsesMentionsCoreComponent
  implements OnInit, OnChanges
{
  @Input({ required: true }) pieceMetaData: PieceMetadataModel;
  @Input({ required: true }) actionOrTriggerName: string;
  @Input({ required: true }) stepName: string;
  @Input({ required: true }) flow: Pick<PopulatedFlow, 'id' | 'version'>;
  @Input({ required: true }) webhookPrefix: string;
  @Input({ required: true }) formPieceTriggerPrefix: string;
  @Input({ required: true }) propertiesMap: PiecePropertyMap;
  @Input({ required: true }) input: Record<string, any> = {};
  @Input({ required: true }) customizedInputs: Record<string, boolean> = {};
  @Input({ required: true })
  allConnectionsForPiece: DropdownOption<`{{connections['${string}']}}`>[];
  @Input({ required: true }) form: UntypedFormGroup;
  @Input({ required: true }) hideCustomizedInputs = false;
  @Output() customizedInputsChanged = new EventEmitter<{
    propertyName: string;
    value: boolean;
  }>();
  @Input() triggerName?: string;
  @Output() formValueChange = new EventEmitter<{
    input: Record<string, any>;
    customizedInputs: Record<string, boolean | Record<string, boolean>>;
    valid: boolean;
  }>();
  readonly PropertyType = PropertyType;
  emitNewChanges$?: Observable<unknown>;
  stepChanged$ = new BehaviorSubject('');
  constructor(private fb: UntypedFormBuilder) {
    super();
  }
  ngOnInit(): void {
    this.emitNewChanges$ = this.createChangesListener();
  }
  ngOnChanges(changes: SimpleChanges): void {
    const properties = changes['propertiesMap'];
    const stepName = changes['stepName'];
    if (
      properties?.firstChange ||
      stepName?.firstChange ||
      !deepEqual(properties?.currentValue, properties?.previousValue) ||
      stepName?.currentValue !== stepName?.previousValue
    ) {
      this.initializeForm();
      if (stepName?.currentValue !== stepName?.previousValue) {
        this.stepChanged$.next(stepName.currentValue);
      }
    }
  }

  private initializeForm() {
    this.buildForm();
  }

  private buildForm() {
    createFormControlsWithTheirValidators(
      this.fb,
      this.propertiesMap,
      this.form,
      this.input,
      this.customizedInputs
    );
    this.form.markAllAsTouched();
  }

  toggleCustomizedInput(
    property: PieceProperty,
    propertyName: string,
    value: boolean
  ) {
    this.customizedInputs = {
      ...this.customizedInputs,
      [propertyName]: value,
    };
    if (property.type === PropertyType.JSON) {
      if (value) {
        this.form.controls[propertyName].removeValidators(jsonValidator);
      } else {
        this.form.controls[propertyName].addValidators(jsonValidator);
      }
    }

    this.customizedInputsChanged.emit({ propertyName, value });
    this.form.controls[propertyName].setValue(
      getPropertyInitialValue(property, undefined),
      { emitEvent: false }
    );
    this.form.controls[propertyName].updateValueAndValidity({
      emitEvent: false,
    });
    setTimeout(() => {
      this.form.markAllAsTouched();
    });
  }
  private createChangesListener() {
    return this.form.valueChanges.pipe(
      //need this because monaco json control emits initial value as a new value which causes a step with a json control to save automatically
      distinctUntilChanged((prev, curr) =>
        deepEqual(prev, curr, { strict: true })
      ),
      tap((res) => {
        this.formValueChange.emit({
          input: res,
          customizedInputs: this.customizedInputs,
          valid: this.form.valid,
        });
      })
    );
  }

  dynamicPropertyCustomizedInputsChangedHandler(event: {
    value: boolean;
    propertyName: string;
  }) {
    this.customizedInputs = {
      ...this.customizedInputs,
      [event.propertyName]: event.value,
    };
  }
}
