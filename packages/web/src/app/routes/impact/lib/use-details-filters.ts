import { useMemo, useState } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

import { convertToSeconds, TIME_UNITS, TimeUnit } from './impact-utils';
import { FlowDetailRow, Owner } from './use-flow-details-data';

type TimeSavedRangeState = {
  min: string;
  max: string;
  unitMin: TimeUnit;
  unitMax: TimeUnit;
};

type OwnerFilterState = {
  selectedIds: string[];
  searchQuery: string;
  popoverOpen: boolean;
};

const DEFAULT_TIME_SAVED_RANGE: TimeSavedRangeState = {
  min: '',
  max: '',
  unitMin: 'Sec',
  unitMax: 'Sec',
};

export function useDetailsFilters(
  flowDetails: FlowDetailRow[] | undefined,
  uniqueOwners: Owner[],
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyFlowsOnly, setShowMyFlowsOnly] = useState(false);

  const [appliedTimeSaved, setAppliedTimeSaved] =
    useState<TimeSavedRangeState>(DEFAULT_TIME_SAVED_RANGE);
  const [draftTimeSaved, setDraftTimeSaved] =
    useState<TimeSavedRangeState>(DEFAULT_TIME_SAVED_RANGE);
  const [timeSavedPopoverOpen, setTimeSavedPopoverOpen] = useState(false);

  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterState>({
    selectedIds: [],
    searchQuery: '',
    popoverOpen: false,
  });

  const currentUserId = authenticationSession.getCurrentUserId();

  const updateDraftTimeSaved = (updates: Partial<TimeSavedRangeState>) => {
    setDraftTimeSaved((prev) => ({ ...prev, ...updates }));
  };

  const updateOwnerFilter = (updates: Partial<OwnerFilterState>) => {
    setOwnerFilter((prev) => ({ ...prev, ...updates }));
  };

  const cycleDraftTimeUnitMin = () => {
    const idx = TIME_UNITS.indexOf(draftTimeSaved.unitMin);
    updateDraftTimeSaved({
      unitMin: TIME_UNITS[(idx + 1) % TIME_UNITS.length],
    });
  };

  const cycleDraftTimeUnitMax = () => {
    const idx = TIME_UNITS.indexOf(draftTimeSaved.unitMax);
    updateDraftTimeSaved({
      unitMax: TIME_UNITS[(idx + 1) % TIME_UNITS.length],
    });
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      setDraftTimeSaved(appliedTimeSaved);
    }
    setTimeSavedPopoverOpen(open);
  };

  const applyTimeSavedFilter = () => {
    setAppliedTimeSaved(draftTimeSaved);
    setTimeSavedPopoverOpen(false);
  };

  const clearTimeSavedFilter = () => {
    setDraftTimeSaved(DEFAULT_TIME_SAVED_RANGE);
    setAppliedTimeSaved(DEFAULT_TIME_SAVED_RANGE);
    setTimeSavedPopoverOpen(false);
  };

  const timeSavedLabel = useMemo(() => {
    if (!appliedTimeSaved.min && !appliedTimeSaved.max) return null;
    const min = appliedTimeSaved.min
      ? `${appliedTimeSaved.min} ${appliedTimeSaved.unitMin}`
      : '0';
    const max = appliedTimeSaved.max
      ? `${appliedTimeSaved.max} ${appliedTimeSaved.unitMax}`
      : '∞';
    return `${min} – ${max}`;
  }, [appliedTimeSaved]);

  const toggleOwner = (ownerId: string) => {
    setOwnerFilter((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(ownerId)
        ? prev.selectedIds.filter((id) => id !== ownerId)
        : [...prev.selectedIds, ownerId],
    }));
  };

  const filteredOwners = useMemo(() => {
    if (!ownerFilter.searchQuery.trim()) return uniqueOwners;
    const query = ownerFilter.searchQuery.toLowerCase();
    return uniqueOwners.filter((o) => o.name.toLowerCase().includes(query));
  }, [uniqueOwners, ownerFilter.searchQuery]);

  const selectedOwners = useMemo(
    () => uniqueOwners.filter((o) => ownerFilter.selectedIds.includes(o.id)),
    [uniqueOwners, ownerFilter.selectedIds],
  );

  const hasActiveFilters =
    searchQuery !== '' ||
    appliedTimeSaved.min !== '' ||
    appliedTimeSaved.max !== '' ||
    ownerFilter.selectedIds.length > 0;

  const clearAllFilters = () => {
    setSearchQuery('');
    setAppliedTimeSaved(DEFAULT_TIME_SAVED_RANGE);
    updateOwnerFilter({ selectedIds: [] });
  };

  const filteredData = useMemo(() => {
    if (!flowDetails) return [];

    let filtered = flowDetails;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((f) =>
        f.flowName.toLowerCase().includes(query),
      );
    }

    if (showMyFlowsOnly) {
      filtered = filtered.filter((f) => f.ownerId === currentUserId);
    }

    if (ownerFilter.selectedIds.length > 0) {
      filtered = filtered.filter(
        (f) => f.ownerId && ownerFilter.selectedIds.includes(f.ownerId),
      );
    }

    const minValue = appliedTimeSaved.min
      ? parseFloat(appliedTimeSaved.min)
      : null;
    const maxValue = appliedTimeSaved.max
      ? parseFloat(appliedTimeSaved.max)
      : null;

    if (minValue !== null) {
      filtered = filtered.filter(
        (f) =>
          f.minutesSaved >=
          convertToSeconds(minValue, appliedTimeSaved.unitMin),
      );
    }

    if (maxValue !== null) {
      filtered = filtered.filter(
        (f) =>
          f.minutesSaved <=
          convertToSeconds(maxValue, appliedTimeSaved.unitMax),
      );
    }

    return filtered.sort((a, b) => b.minutesSaved - a.minutesSaved);
  }, [
    flowDetails,
    searchQuery,
    showMyFlowsOnly,
    currentUserId,
    ownerFilter.selectedIds,
    appliedTimeSaved,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    showMyFlowsOnly,
    setShowMyFlowsOnly,

    draftTimeSaved,
    updateDraftTimeSaved,
    cycleDraftTimeUnitMin,
    cycleDraftTimeUnitMax,
    timeSavedPopoverOpen,
    handleTimeSavedPopoverOpen,
    applyTimeSavedFilter,
    clearTimeSavedFilter,
    timeSavedLabel,

    ownerFilter,
    updateOwnerFilter,
    toggleOwner,
    filteredOwners,
    selectedOwners,

    hasActiveFilters,
    clearAllFilters,
    filteredData,
  };
}
