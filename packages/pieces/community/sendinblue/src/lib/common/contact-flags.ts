function blacklistFlag(ticked: boolean | undefined): true | undefined {
	return ticked === true ? true : undefined;
}

function unsubscribeBody({
	unsubscribeEmail,
	unsubscribeSms,
	unlinkListIds,
}: UnsubscribeInput): UnsubscribeBody {
	if (unsubscribeEmail !== true && unsubscribeSms !== true && unlinkListIds.length === 0) {
		throw new Error(
			'Tick Unsubscribe From Email or Unsubscribe From SMS, or pick a list to remove.',
		);
	}

	return {
		emailBlacklisted: blacklistFlag(unsubscribeEmail),
		smsBlacklisted: blacklistFlag(unsubscribeSms),
		unlinkListIds: unlinkListIds.length > 0 ? unlinkListIds : undefined,
	};
}

export const contactFlags = { blacklistFlag, unsubscribeBody };

export type UnsubscribeInput = {
	unsubscribeEmail: boolean | undefined;
	unsubscribeSms: boolean | undefined;
	unlinkListIds: number[];
};

export type UnsubscribeBody = {
	emailBlacklisted: true | undefined;
	smsBlacklisted: true | undefined;
	unlinkListIds: number[] | undefined;
};
