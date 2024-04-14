import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  MAXIMUM_ALLOWED_TASKS,
  ProjectBillingResponse,
} from '@activepieces/ee-shared';
import { ProjectWithLimits } from '@activepieces/shared';
import { BillingService } from '../service/billing.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthenticationService, ProjectService } from '@activepieces/ui/common';

interface BillingLimits {
  tasks: FormControl<number>;
}

@Component({
  selector: 'app-plans-page',
  templateUrl: './plans-page.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansPageComponent implements OnInit {
  options = {
    path: '/assets/lottie/gift.json',
  };
  upgrade$: Observable<void> | undefined;
  upgradeLoading = false;
  manageLoading = false;
  billingForm: FormGroup<BillingLimits>;
  loadInitialValue$: Observable<void> | undefined;
  project$: Observable<ProjectWithLimits> | undefined;
  billingInformation$: Observable<ProjectBillingResponse> | undefined;
  openPortal$: Observable<void> | undefined;
  disableOrEnable$: Observable<void>;
  updateProject$: Observable<unknown> | undefined;
  constructor(
    private billingService: BillingService,
    private authenticationService: AuthenticationService,
    private fb: FormBuilder,
    private projectService: ProjectService
  ) {
    this.billingForm = this.fb.group({
      tasks: this.fb.control(15000, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^[0-9]*$/),
          Validators.max(MAXIMUM_ALLOWED_TASKS),
        ],
      }),
    });
    this.billingInformation$ = this.billingService.getSubscription();
    this.disableOrEnable$ = this.billingInformation$.pipe(
      map((billingInformation) => {
        if (billingInformation.subscription.subscriptionStatus === 'active') {
          this.billingForm.enable();
        } else {
          this.billingForm.disable();
        }
      })
    );
    this.project$ = this.projectService.currentProject$.pipe(
      map((project) => project!)
    );
    this.loadInitialValue$ = this.project$.pipe(
      tap((project) => {
        this.billingForm.patchValue({
          tasks: project.plan.tasks,
        });
      }),
      map(() => void 0)
    );
  }

  ngOnInit(): void {
    this.addTallyScript();
  }

  private addTallyScript() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://tally.so/widgets/embed.js';
    document.head.appendChild(script);
  }

  upgrade() {
    this.upgradeLoading = true;
    this.upgrade$ = this.billingService.upgrade().pipe(
      tap(({ paymentLink }) => {
        this.upgradeLoading = false;
        window.location.href = paymentLink;
      }),
      map(() => void 0)
    );
  }

  openPortal() {
    this.manageLoading = true;
    this.openPortal$ = this.billingService.portalLink().pipe(
      tap(({ portalLink }) => {
        this.manageLoading = false;
        window.location.href = portalLink;
      }),
      map(() => void 0)
    );
  }

  saveLimits() {
    if (this.billingForm.invalid) {
      return;
    }
    const limit = this.billingForm.value.tasks;
    this.updateProject$ = this.projectService.update(
      this.authenticationService.getProjectId()!,
      {
        plan: {
          tasks: limit!,
        },
      }
    );
  }
}
