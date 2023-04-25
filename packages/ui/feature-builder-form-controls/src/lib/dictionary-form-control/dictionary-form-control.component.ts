import { Component, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { InterpolatingTextFormControlComponent } from '../interpolating-text-form-control/interpolating-text-form-control.component';
import { InsertMentionOperation } from '../interpolating-text-form-control/utils';
import { BuilderAutocompleteMentionsDropdownComponent } from '../interpolating-text-form-control/builder-autocomplete-mentions-dropdown/builder-autocomplete-mentions-dropdown.component';

@Component({
  selector: 'app-dictonary-form-control',
  templateUrl: './dictionary-form-control.component.html',
  styleUrls: ['./dictionary-form-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DictionaryFormControlComponent,
    },
  ],
})
export class DictionaryFormControlComponent
  implements ControlValueAccessor, OnInit
{
  form!: UntypedFormGroup;
  disabled = false;
  valueChanges$: Observable<void>;
  onChange: (val: unknown) => void = (val) => {
    val;
  };
  onTouched: () => void = () => {
    //ignore
  };

  constructor(private fb: UntypedFormBuilder) {
    this.form = this.fb.group({ pairs: this.fb.array([]) });
    this.valueChanges$ = this.form.valueChanges.pipe(
      tap(() => {
        this.dictionaryControlValueChanged();
      })
    );
  }
  ngOnInit(): void {
    this.addNewPair();
  }

  writeValue(dictionaryValue: Record<string, unknown>): void {
    this.pairs.clear({ emitEvent: false });
    if (dictionaryValue) {
      const pairsKeys = Object.keys(dictionaryValue);
      const pairsToInsert = pairsKeys.map((key) => {
        return { key: key, value: dictionaryValue[key] };
      });
      pairsToInsert.forEach((p) => {
        this.addPair(p, false);
      });
    }
    this.addNewPair(false);
  }
  registerOnChange(change: (val: unknown) => void): void {
    this.onChange = change;
  }
  registerOnTouched(touched: () => void): void {
    this.onTouched = touched;
  }

  get pairs() {
    return this.form.get('pairs') as UntypedFormArray;
  }
  addNewPair(triggerChangeDetection: boolean = true) {
    this.addPair({ key: '', value: '' }, triggerChangeDetection);
  }

  addPair(
    pair: { key: string; value: unknown },
    triggerChangeDetection: boolean = true
  ) {
    const pairGroup = this.fb.group({
      key: new UntypedFormControl(pair.key),
      value: new UntypedFormControl(pair.value),
    });
    this.pairs.push(pairGroup, { emitEvent: triggerChangeDetection });
  }

  removePair(indexOfPair: number) {
    if (this.pairs.length > 1) {
      this.pairs.removeAt(indexOfPair);
      this.onChange(this.formatControlValue());
    }
  }
  getPair(indexOfPair: number) {
    return this.pairs.at(indexOfPair) as UntypedFormGroup;
  }

  dictionaryControlValueChanged() {
    this.onChange(this.formatControlValue());
  }
  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
    if (this.disabled) {
      this.pairs.disable();
    } else {
      this.pairs.enable();
    }
  }
  formatControlValue() {
    const dictonaryControlValue: { [key: string]: unknown } = {};
    this.pairs.controls.forEach((pairGroup) => {
      if (pairGroup.get('key')?.value && pairGroup.get('value')?.value) {
        const key = pairGroup.get('key')?.value;
        const value = pairGroup.get('value')?.value;
        dictonaryControlValue[key] = value;
      }
    });
    return dictonaryControlValue;
  }
  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mention: InsertMentionOperation
  ) {
    await textControl.addMention(mention);
  }
  showMenu(
    $event: MouseEvent,
    mentionsDropdown: BuilderAutocompleteMentionsDropdownComponent
  ) {
    $event.stopImmediatePropagation();
    mentionsDropdown.showMenuSubject$.next(true);
  }
}
