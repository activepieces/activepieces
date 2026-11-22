function requireSpecificEvent({ eventId }: { eventId: string | undefined }): string {
  if (!eventId) {
    throw new Error(
      'Select the event to watch, or untick Target Specific Event.'
    );
  }
  return eventId;
}

export const specificEvent = { require: requireSpecificEvent };
