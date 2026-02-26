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
  const [appliedTimeUnitMin, setAppliedTimeUnitMin] = useState<TimeUnit>('Sec');
  const [appliedTimeUnitMax, setAppliedTimeUnitMax] = useState<TimeUnit>('Sec');

  const [draftTimeSavedMin, setDraftTimeSavedMin] = useState('');
  const [draftTimeSavedMax, setDraftTimeSavedMax] = useState('');
  const [draftTimeUnitMin, setDraftTimeUnitMin] = useState<TimeUnit>('Sec');
  const [draftTimeUnitMax, setDraftTimeUnitMax] = useState<TimeUnit>('Sec');
  const [timeSavedPopoverOpen, setTimeSavedPopoverOpen] = useState(false);

  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false);

  const currentUserId = authenticationSession.getCurrentUserId();

  const cycleDraftTimeUnitMin = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnitMin);
    setDraftTimeUnitMin(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const cycleDraftTimeUnitMax = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnitMax);
    setDraftTimeUnitMax(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      setDraftTimeSavedMin(appliedTimeSavedMin);
      setDraftTimeSavedMax(appliedTimeSavedMax);
      setDraftTimeUnitMin(appliedTimeUnitMin);
      setDraftTimeUnitMax(appliedTimeUnitMax);
    }
    setTimeSavedPopoverOpen(open);
  };

  const applyTimeSavedFilter = () => {
    setAppliedTimeSavedMin(draftTimeSavedMin);
    setAppliedTimeSavedMax(draftTimeSavedMax);
    setAppliedTimeUnitMin(draftTimeUnitMin);
    setAppliedTimeUnitMax(draftTimeUnitMax);
    setTimeSavedPopoverOpen(false);
  };

  const clearTimeSavedFilter = () => {
    setDraftTimeSavedMin('');
    setDraftTimeSavedMax('');
    setDraftTimeUnitMin('Sec');
    setDraftTimeUnitMax('Sec');
    setAppliedTimeSavedMin('');
    setAppliedTimeSavedMax('');
    setAppliedTimeUnitMin('Sec');
    setAppliedTimeUnitMax('Sec');
    setTimeSavedPopoverOpen(false);
  };

  const timeSavedLabel = useMemo(() => {
    if (!appliedTimeSavedMin && !appliedTimeSavedMax) return null;
    const min = appliedTimeSavedMin
      ? `${appliedTimeSavedMin} ${appliedTimeUnitMin}`
      : '0';
    const max = appliedTimeSavedMax
      ? `${appliedTimeSavedMax} ${appliedTimeUnitMax}`
      : '∞';
    return `${min} – ${max}`;
  }, [
    appliedTimeSavedMin,
    appliedTimeSavedMax,
    appliedTimeUnitMin,
    appliedTimeUnitMax,
  ]);

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
    searchQuery !== '' ||
    appliedTimeSavedMin !== '' ||
    appliedTimeSavedMax !== '' ||
    selectedOwnerIds.length > 0;

  const clearAllFilters = () => {
    setSearchQuery('');
    setAppliedTimeSavedMin('');
    setAppliedTimeSavedMax('');
    setAppliedTimeUnitMin('Sec');
    setAppliedTimeUnitMax('Sec');
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
        (f) => f.minutesSaved >= convertToSeconds(minValue, appliedTimeUnitMin),
      );
    }

    if (maxValue !== null) {
      filtered = filtered.filter(
        (f) => f.minutesSaved <= convertToSeconds(maxValue, appliedTimeUnitMax),
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
    appliedTimeUnitMin,
    appliedTimeUnitMax,
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
    draftTimeUnitMin,
    cycleDraftTimeUnitMin,
    draftTimeUnitMax,
    cycleDraftTimeUnitMax,
    timeSavedPopoverOpen,
    handleTimeSavedPopoverOpen,
    applyTimeSavedFilter,
    clearTimeSavedFilter,
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
