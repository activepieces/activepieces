import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { copyText } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';

interface PlatformSettingsForm {
  customDomain: FormControl<string | null>;
}
interface DnsRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  content: string;
}
@Component({
  selector: 'app-platform-settings',
  templateUrl: './platform-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformSettingsComponent {
  formGroup: FormGroup<PlatformSettingsForm>;
  records: DnsRecord[] = [
    {
      type: 'TXT',
      content: 'iXaWXthPkMSgNqfBaOezQGeioUgRpsui',
      name: 'xyz.customdomain.co',
    },
    {
      type: 'CNAME',
      content: 'K5Rnd1OLw9L6HamjeZWdhrHWOwQ3DLaD.co',
      name: 'xyz.customdomain.co',
    },
    {
      type: 'TXT',
      content: 'oOytttj9S3vGUyYsalUsVqQm7EzIonbl',
      name: '_cf-customdomain.hostname.axzxcasd',
    },
  ];
  customDomainNote$: Observable<string>;
  message = $localize`Please set the following TXT and CNAME records in your DNS provider, then click verify to confirm your control over the domain.`;
  constructor(private fb: FormBuilder, private matSnakcbar: MatSnackBar) {
    this.formGroup = this.fb.group({
      customDomain: this.fb.control({
        disabled: false,
        value: 'xyz.customdomain.co',
      }),
    });
    this.customDomainNote$ =
      this.formGroup.controls.customDomain.valueChanges.pipe(
        startWith(''),
        map((res) => {
          if (!res) {
            return `Set up a CNAME for your custom domain, resolving to <b>abcdxyz.activepieces.co</b>, with the lowest TTL possible`;
          } else {
            return `Set up a CNAME for your <b>${res}</b>, resolving to <b>abcdxyz.activepieces.co</b>, with the lowest TTL possible`;
          }
        })
      );
  }
  copyValue(val: string) {
    copyText(val);
    this.matSnakcbar.open('Copied successfully');
  }
}
