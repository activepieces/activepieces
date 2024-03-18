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
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { PieceMetadataModel, jsonValidator } from '@activepieces/ui/common';
import { PopulatedFlow } from '@activepieces/shared';
import {
  FormBuilder,
  FormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { ValidatorFn } from '@angular/forms';
import deepEqual from 'deep-equal';

@Component({
  selector: 'app-new-piece-properties-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './piece-properties-form.component.html',
})
export class NewPiecePropertiesFormComponent implements OnInit, OnChanges {
  @Input({ required: true }) pieceMetaData: PieceMetadataModel;
  @Input({ required: true }) actionOrTriggerName: string;
  @Input({ required: true }) stepName: string;
  @Input({ required: true }) flow: Pick<PopulatedFlow, 'id' | 'version'>;
  @Input({ required: true }) webhookPrefix: string;
  @Input({ required: true }) formPieceTriggerPrefix: string;
  @Input({ required: true }) propertiesMap: PiecePropertyMap;
  @Input({ required: true }) input: Record<string, any> = {};
  @Input({ required: true }) customizedInputs: Record<
    string,
    boolean | Record<string, boolean>
  > = {};
  @Input({ required: true })
  allConnectionsForPiece: DropdownOption<`{{connections['${string}']}}`>[];

  @Output() formValueChange = new EventEmitter<{
    input: Record<string, any>;
    customizedInputs: Record<string, boolean | Record<string, boolean>>;
    valid: boolean;
  }>();
  readonly PropertyType = PropertyType;
  sortedPropertiesByRequired: PiecePropertyMap;
  form: UntypedFormGroup = this.fb.group({});
  emitNewChanges$?: Observable<unknown>;
  constructor(private fb: FormBuilder) {
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
    }
  }
  ngOnInit(): void {}

  private initializeForm() {
    this.sortPropertiesByRequired();
    this.buildForm();
  }

  private sortPropertiesByRequired() {
    const requiredProperties: PiecePropertyMap = {};
    const optionalProperties: PiecePropertyMap = {};
    Object.entries(this.propertiesMap).forEach(([key, value]) => {
      if (value.required) {
        requiredProperties[key] = value;
      } else {
        optionalProperties[key] = value;
      }
    });
    this.sortedPropertiesByRequired = {
      ...requiredProperties,
      ...optionalProperties,
    };
  }

  private buildForm() {
    this.removeAllFormControls();
    this.createFormControlsWithTheirValidators();
    this.form.markAllAsTouched();
  }

  private createFormControlsWithTheirValidators() {
    Object.entries(this.propertiesMap).forEach(([propertyName, property]) => {
      const value = this.input[propertyName];
      const validators: ValidatorFn[] = [];
      if (
        this.propertiesMap[propertyName].required &&
        this.propertiesMap[propertyName].type !== PropertyType.OBJECT
      ) {
        validators.push(Validators.required);
      }
      if (
        property.type === PropertyType.JSON &&
        !this.customizedInputs[propertyName]
      ) {
        validators.push(jsonValidator);
      }
      const ctrl = new FormControl(
        value === '' || value === null || value === undefined
          ? undefined
          : value,
        {
          validators: validators,
        },
      );
      this.form.addControl(propertyName, ctrl, { emitEvent: false });
    });
  }

  private removeAllFormControls() {
    Object.keys(this.form.controls).forEach((ctrlName) => {
      this.form.removeControl(ctrlName, { emitEvent: false });
    });
  }

  toggleCustomizedInput(
    property: PieceProperty,
    propertyName: string,
    value: boolean,
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
    this.form.controls[propertyName].setValue('', { emitEvent: false });
    this.form.controls[propertyName].updateValueAndValidity({
      emitEvent: false,
    });
  }
  private createChangesListener() {
    return this.form.valueChanges.pipe(
      tap((res) => {
        this.formValueChange.emit({
          input: res,
          customizedInputs: this.customizedInputs,
          valid: this.form.valid,
        });
      }),
    );
  }
}
