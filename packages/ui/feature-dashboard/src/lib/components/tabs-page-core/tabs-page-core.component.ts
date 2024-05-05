import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export class TabsPageCoreComponent {
  fragmentChanged$?: Observable<string | null>;
  tabGroup?: MatTabGroup;
  constructor(
    protected tabIndexFragmentMap: { fragmentName: string }[],
    protected router: Router,
    protected route: ActivatedRoute
  ) {}
  afterViewInit(): void {
    this.fragmentChanged$ = this.route.fragment.pipe(
      tap((fragment) => {
        if (fragment === null) {
          this.updateFragment(this.tabIndexFragmentMap[0].fragmentName);
        } else {
          this.fragmentCheck(fragment);
        }
      })
    );
  }

  private fragmentCheck(fragment: string) {
    if (this.tabGroup) {
      const tabIndex = this.tabIndexFragmentMap.findIndex(
        (i) => i.fragmentName === fragment
      );
      if (tabIndex >= 0) {
        this.tabGroup.selectedIndex = tabIndex;
      }
    }
  }
  updateFragment(
    newFragment: string,
    queryParams: Record<string, string | number> = {}
  ) {
    this.router.navigate([], {
      fragment: newFragment,
      queryParams,
    });
  }
  tabChanged(event: MatTabChangeEvent) {
    if (event.index < 0 || event.index >= this.tabIndexFragmentMap.length)
      return;
    this.updateFragment(this.tabIndexFragmentMap[event.index].fragmentName);
  }
}
