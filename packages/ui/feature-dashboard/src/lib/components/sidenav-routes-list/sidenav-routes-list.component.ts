import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FolderActions } from '../../store/folders/folders.actions';

type SideNavRoute = {
  icon: string;
  borderColorInTailwind: string;
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
  constructor(public router: Router, private store: Store) {}

  sideNavRoutes: SideNavRoute[] = [
    {
      icon: '/assets/img/custom/dashboard/collections.svg',
      borderColorInTailwind: '!ap-border-purpleBorder',
      caption: 'Flows',
      route: 'flows',
      effect: () => {
        this.store.dispatch(FolderActions.showAllFlows());
      },
    },
    {
      icon: 'assets/img/custom/dashboard/runs.svg',
      borderColorInTailwind: '!ap-border-greenBorder',
      caption: 'Runs',
      route: 'runs',
    },
    {
      icon: 'assets/img/custom/connections.svg',
      borderColorInTailwind: '!ap-border-blueBorder',
      caption: 'Connections',
      route: 'connections',
    },
  ];

  openDocs() {
    window.open('https://activepieces.com/docs', '_blank');
  }
  redirectHome(newWindow: boolean) {
    if (newWindow) {
      const url = this.router.serializeUrl(this.router.createUrlTree([``]));
      window.open(url, '_blank');
    } else {
      const urlArrays = this.router.url.split('/');
      urlArrays.splice(urlArrays.length - 1, 1);
      const fixedUrl = urlArrays.join('/');
      this.router.navigate([fixedUrl]);
    }
  }
}
