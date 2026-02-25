import { useMemo, useState } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

import { convertToSeconds, TIME_UNITS, TimeUnit } from './impact-utils';
import { FlowDetailRow, Owner } from './use-flow-details-data';

export function useDetailsFilters(
  flowDetails: FlowDetailRow[] | undefined,
  uniqueOwners: Owner[],
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyFlowsOnly, setShowMyFlowsOnly] = useState(false);

  const [appliedTimeSavedMin, setAppliedTimeSavedMin] = useState('');
  const [appliedTimeSavedMax, setAppliedTimeSavedMax] = useState('');
  const [appliedTimeUnit, setAppliedTimeUnit] = useState<TimeUnit>('Sec');

  const [draftTimeSavedMin, setDraftTimeSavedMin] = useState('');
  const [draftTimeSavedMax, setDraftTimeSavedMax] = useState('');
  const [draftTimeUnit, setDraftTimeUnit] = useState<TimeUnit>('Sec');
  const [timeSavedPopoverOpen, setTimeSavedPopoverOpen] = useState(false);

  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false);

  const currentUserId = authenticationSession.getCurrentUserId();

  const cycleDraftTimeUnit = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnit);
    setDraftTimeUnit(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      setDraftTimeSavedMin(appliedTimeSavedMin);
      setDraftTimeSavedMax(appliedTimeSavedMax);
      setDraftTimeUnit(appliedTimeUnit);
    }
    setTimeSavedPopoverOpen(open);
  };

  const applyTimeSavedFilter = () => {
    setAppliedTimeSavedMin(draftTimeSavedMin);
    setAppliedTimeSavedMax(draftTimeSavedMax);
    setAppliedTimeUnit(draftTimeUnit);
    setTimeSavedPopoverOpen(false);
  };

  const timeSavedLabel = useMemo(() => {
    if (!appliedTimeSavedMin && !appliedTimeSavedMax) return null;
    const min = appliedTimeSavedMin || '0';
    const max = appliedTimeSavedMax || '∞';
    return `${min} – ${max} ${appliedTimeUnit}`;
  }, [appliedTimeSavedMin, appliedTimeSavedMax, appliedTimeUnit]);

  const toggleOwner = (ownerId: string) => {
    setSelectedOwnerIds((prev) =>
      prev.includes(ownerId)
        ? prev.filter((id) => id !== ownerId)
        : [...prev, ownerId],
    );
  };

  const filteredOwners = useMemo(() => {
    if (!ownerSearchQuery.trim()) return uniqueOwners;
    const query = ownerSearchQuery.toLowerCase();
    return uniqueOwners.filter((o) => o.name.toLowerCase().includes(query));
  }, [uniqueOwners, ownerSearchQuery]);

  const selectedOwners = useMemo(
    () => uniqueOwners.filter((o) => selectedOwnerIds.includes(o.id)),
    [uniqueOwners, selectedOwnerIds],
  );

  const hasActiveFilters =
    appliedTimeSavedMin !== '' ||
    appliedTimeSavedMax !== '' ||
    selectedOwnerIds.length > 0;

  const clearAllFilters = () => {
    setAppliedTimeSavedMin('');
    setAppliedTimeSavedMax('');
    setAppliedTimeUnit('Sec');
    setSelectedOwnerIds([]);
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

    if (selectedOwnerIds.length > 0) {
      filtered = filtered.filter(
        (f) => f.ownerId && selectedOwnerIds.includes(f.ownerId),
      );
    }

    const minValue = appliedTimeSavedMin
      ? parseFloat(appliedTimeSavedMin)
      : null;
    const maxValue = appliedTimeSavedMax
      ? parseFloat(appliedTimeSavedMax)
      : null;

    if (minValue !== null) {
      filtered = filtered.filter(
        (f) => f.minutesSaved >= convertToSeconds(minValue, appliedTimeUnit),
      );
    }

    if (maxValue !== null) {
      filtered = filtered.filter(
        (f) => f.minutesSaved <= convertToSeconds(maxValue, appliedTimeUnit),
      );
    }

    return filtered.sort((a, b) => b.minutesSaved - a.minutesSaved);
  }, [
    flowDetails,
    searchQuery,
    showMyFlowsOnly,
    currentUserId,
    selectedOwnerIds,
    appliedTimeSavedMin,
    appliedTimeSavedMax,
    appliedTimeUnit,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    showMyFlowsOnly,
    setShowMyFlowsOnly,

    draftTimeSavedMin,
    setDraftTimeSavedMin,
    draftTimeSavedMax,
    setDraftTimeSavedMax,
    draftTimeUnit,
    cycleDraftTimeUnit,
    timeSavedPopoverOpen,
    handleTimeSavedPopoverOpen,
    applyTimeSavedFilter,
    timeSavedLabel,

    selectedOwnerIds,
    setSelectedOwnerIds,
    ownerSearchQuery,
    setOwnerSearchQuery,
    ownerPopoverOpen,
    setOwnerPopoverOpen,
    toggleOwner,
    filteredOwners,
    selectedOwners,

    hasActiveFilters,
    clearAllFilters,
    filteredData,
  };
}
