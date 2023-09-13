import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FolderActions } from '../../store/folders/folders.actions';
import { supportUrl } from '@activepieces/shared';

type SideNavRoute = {
  icon: string;
  caption: string;
  route: string;
  effect?: () => void;
};

@Component({
  selector: 'app-sidenav-routes-list',
  templateUrl: './sidenav-routes-list.component.html',
  styleUrls: ['./sidenav-routes-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavRoutesListComponent {
  constructor(
    public router: Router,
    private store: Store,
    private cd: ChangeDetectorRef
  ) {}
  sideNavRoutes: SideNavRoute[] = [
    {
      icon: '/assets/img/custom/dashboard/flows.svg',
      caption: $localize`Flows`,
      route: 'flows',
      effect: () => {
        this.store.dispatch(FolderActions.showAllFlows());
      },
    },
    {
      icon: 'assets/img/custom/dashboard/runs.svg',
      caption: $localize`Runs`,
      route: 'runs',
    },
    {
      icon: 'assets/img/custom/dashboard/connections.svg',
      caption: $localize`Connections`,
      route: 'connections',
    },
  ];

  openDocs() {
    window.open('https://activepieces.com/docs', '_blank', 'noopener');
  }
  redirectHome(newWindow: boolean) {
    if (newWindow) {
      const url = this.router.serializeUrl(this.router.createUrlTree([``]));
      window.open(url, '_blank', 'noopener');
    } else {
      const urlArrays = this.router.url.split('/');
      urlArrays.splice(urlArrays.length - 1, 1);
      const fixedUrl = urlArrays.join('/');
      this.router.navigate([fixedUrl]);
    }
  }

  markChange() {
    this.cd.detectChanges();
  }

  public isActive(route: string) {
    return this.router.url.includes(route);
  }

  openSupport() {
    window.open(supportUrl, '_blank', 'noopener');
  }
}
