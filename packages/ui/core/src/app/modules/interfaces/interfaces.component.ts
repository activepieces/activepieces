import { Property } from '@activepieces/pieces-framework';
import { PopulatedFlow } from '@activepieces/shared';
import { FlagService, FlowService, environment } from '@activepieces/ui/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';
import { InterfacesService } from './interfaces.service';

type Input = {
  displayName: string;
  required: boolean;
  description: string;
  placeholder: string;
};

type InterfaceProps = {
  textInputs: Input[];
  waitForResponse: boolean;
};

@Component({
  selector: 'app-interfaces',
  templateUrl: './interfaces.component.html',
  styleUrls: ['./interfaces.component.scss'],
})
export class InterfacesComponent {
  fullLogoUrl$: Observable<string>;
  flow$: Observable<PopulatedFlow>;
  submitInterface$: Observable<any>;
  interfaceForm: FormGroup;
  props: InterfaceProps | null = null;
  textInputs: Input[] = [];
  loading = false;
  error: string | null = null;
  webhookUrl: string | null = null;
  constructor(
    private flowService: FlowService,
    private router: ActivatedRoute,
    private flagService: FlagService,
    private interfacesService: InterfacesService
  ) {
    this.fullLogoUrl$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }

  ngOnInit(): void {
    this.flow$ = this.router.paramMap.pipe(
      switchMap((params) =>
        this.flowService.get(params.get('flowId') as string)
      ),
      tap((flow) => {
        if (flow.version.trigger.settings.triggerName === 'interface_trigger') {
          this.webhookUrl = environment.apiUrl + '/webhooks/' + flow.id;
          this.interfaceForm = new FormGroup({});
          this.props = flow.version.trigger.settings.input;
          if (this.props?.waitForResponse) {
            this.webhookUrl += '/sync';
          }
          if (this.props?.textInputs) {
            this.buildTextInputs(this.props.textInputs);
          }
        } else {
          this.props = null;
          this.error = 'This flow does not have an interface.';
        }
      })
    );
  }

  async submit() {
    if (this.interfaceForm.valid && !this.loading) {
      this.loading = true;
      console.log(this.interfaceForm.value);
      console.log(this.webhookUrl);
      this.submitInterface$ = this.interfacesService
        .submitInterface(this.webhookUrl as string, this.interfaceForm.value)
        .pipe(
          tap((result) => {
            console.log(result);
            this.loading = false;
          })
        );
    }
  }

  getInputKey(str: string) {
    return str
      .replace(/\s(.)/g, function ($1) {
        return $1.toUpperCase();
      })
      .replace(/\s/g, '')
      .replace(/^(.)/, function ($1) {
        return $1.toLowerCase();
      });
  }

  buildTextInputs(inputs: Input[]) {
    inputs.forEach((prop) => {
      this.textInputs.push(Property.ShortText(prop) as unknown as Input);
      this.interfaceForm.addControl(
        this.getInputKey(prop.displayName),
        new FormControl('', {
          nonNullable: prop.required,
          validators: prop.required ? [Validators.required] : [],
        })
      );
    });
  }
}
