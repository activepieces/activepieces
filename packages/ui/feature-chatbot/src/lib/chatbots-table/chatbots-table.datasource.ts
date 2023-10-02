import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs';
import { combineLatest } from 'rxjs';
import { Chatbot } from '@activepieces/shared';
import { ChatBotService } from '../chatbot.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ChatBotsDataSource extends DataSource<Chatbot> {
  data: Chatbot[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private chatbotService: ChatBotService,
    private refresh$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<Chatbot[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() =>
        this.chatbotService.list({
          limit: 100,
          cursor: undefined,
        })
      ),
      tap((chatbots) => {
        this.data = chatbots.data;
        this.isLoading$.next(false);
      }),
      map((chatbots) => chatbots.data)
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    //ignore
  }
}
