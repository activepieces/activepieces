import { trelloAuth } from '../..';
import { TriggerStrategy, createTrigger, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { trelloCommon, getCardsInBoard, getCardsInList } from '../common';

interface Props {
    board_id: string;
    list_id_opt?: string;
    time_before_due: number;
    time_unit: string;
}

const polling: Polling<PiecePropValueSchema<typeof trelloAuth>, Props> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, propsValue, lastFetchEpochMS }) {
        const { board_id, list_id_opt, time_before_due, time_unit } = propsValue;
        const getCards = list_id_opt ? getCardsInList : getCardsInBoard;
        const cards: any[] = await getCards(auth.username, auth.password, list_id_opt || board_id);

        if(lastFetchEpochMS ===0)
        {
            // If lastFetchEpochMS is 0, we assume this is the test run and return all cards with due dates
            return cards
                .filter(card => card.due && !card.dueComplete)
                .map(card => ({
                    epochMilliSeconds: dayjs(card.due).valueOf(),
                    data: card,
                }));
        }
        const now = dayjs();
        const upcoming = now.add(time_before_due, time_unit as dayjs.ManipulateType);

        return cards
            .filter(card => card.due && !card.dueComplete && dayjs(card.due).isAfter(now) && dayjs(card.due).isBefore(upcoming) && dayjs(card.due).valueOf() > lastFetchEpochMS)
            .map(card => ({
                epochMilliSeconds: dayjs(card.due).valueOf(),
                data: card,
            }));
    },
};

export const deadlineTrigger = createTrigger({
    auth: trelloAuth,
    name: 'deadline',
    displayName: 'Card Deadline',
    description: 'Triggers at a specified time before a card deadline.',
    type: TriggerStrategy.POLLING,
    props: {
        board_id: trelloCommon.board_id,
        list_id_opt: trelloCommon.list_id_opt,
        time_unit: Property.StaticDropdown({
            displayName: 'Time unit',
            description: 'Select unit for time before due',
            required: true,
            options: {
            options: [
                { label: 'Minutes', value: 'minutes' },
                { label: 'Hours', value: 'hours' },
            ],
            },
            defaultValue: 'hours',
        }),
        time_before_due: Property.Number({
            displayName: 'Time before due',
            description: 'How long before the due date the trigger should run (use with time unit)',
            required: true,
            defaultValue: 24,
        }),
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    sampleData: undefined,
});