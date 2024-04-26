import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { validColorValidator } from 'ngx-colors';
import { Platform, UpdatePlatformRequestBody } from '@activepieces/shared';
import { Observable, map, tap } from 'rxjs';
import {
  APPEARANCE_DISABLED_RESOLVER_KEY,
  AuthenticationService,
  PlatformService,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { localesMap } from '@activepieces/ui/common';
import { spreadIfDefined, LocalesEnum } from '@activepieces/shared';
import { PLATFORM_RESOLVER_KEY } from '@activepieces/ui/common';

interface AppearanceForm {
  name: FormControl<string>;
  fullLogoUrl: FormControl<string>;
  logoIconUrl: FormControl<string>;
  favIconUrl: FormControl<string>;
  primaryColor: FormControl<string>;
  pickerCtrl: FormControl<string>;
  defaultLocale: FormControl<LocalesEnum>;
}
@Component({
  selector: 'app-platform-appearance',
  templateUrl: './platform-appearance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformAppearanceComponent implements OnInit {
  logoFileExtensions: string[] = ['.png', '.jpeg', '.jpg', '.svg', '.webp'];
  formGroup: FormGroup<AppearanceForm>;
  loading = false;
  updatePlatform$?: Observable<void>;
  locales = localesMap;
  title = $localize`Appearance`;
  upgradeNoteTitle = $localize`Brand Activepieces`;
  upgradeNote = $localize`Give your users an experience that looks like you by customizing the color, logo and more`;
  platform?: Platform;
  isLocked!: boolean;
  constructor(
    private fb: FormBuilder,
    private platformService: PlatformService,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute
  ) {
    this.isLocked = this.route.snapshot.data[APPEARANCE_DISABLED_RESOLVER_KEY];
    this.platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.formGroup = this.fb.group({
      name: this.fb.control(
        {
          disabled: false,
          value: '',
        },
        { validators: [Validators.required], nonNullable: true }
      ),
      favIconUrl: this.fb.control(
        {
          disabled: false,
          value: '',
        },
        { validators: [Validators.required], nonNullable: true }
      ),
      logoIconUrl: this.fb.control(
        {
          disabled: false,
          value: '',
        },
        {
          validators: [Validators.required],
          nonNullable: true,
        }
      ),
      fullLogoUrl: this.fb.control(
        {
          disabled: false,
          value: '',
        },
        {
          validators: [Validators.required],
          nonNullable: true,
        }
      ),
      primaryColor: this.fb.control(
        {
          disabled: false,
          value: '#6e41e2',
        },
        {
          validators: [Validators.required, validColorValidator],
          nonNullable: true,
        }
      ),
      pickerCtrl: this.fb.control(
        {
          disabled: false,
          value: '#6e41e2',
        },
        { nonNullable: true }
      ),
      defaultLocale: this.fb.control<LocalesEnum>(LocalesEnum.ENGLISH, {
        nonNullable: true,
      }),
    });
  }
  ngOnInit(): void {
    if (this.platform) {
      this.formGroup.patchValue({
        name: this.platform.name,
        favIconUrl: this.platform.favIconUrl,
        logoIconUrl: this.platform.logoIconUrl,
        fullLogoUrl: this.platform.fullLogoUrl,
        primaryColor: this.platform.primaryColor,
        pickerCtrl: this.platform.primaryColor,
        ...spreadIfDefined('defaultLocale', this.platform.defaultLocale),
      });
    }
  }
  save() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid && !this.loading) {
      this.loading = true;
      const request: UpdatePlatformRequestBody = this.formGroup.value;
      const platformId = this.authenticationService.getPlatformId();
      if (!platformId) {
        console.error('no platform in localstorage or it is invalid');
        return;
      }
      this.updatePlatform$ = this.platformService
        .updatePlatform(request, platformId)
        .pipe(
          tap(() => {
            this.loading = false;
            window.location.reload();
          }),
          map(() => void 0)
        );
    }
  }
}
