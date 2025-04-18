import dayjs from 'dayjs';
import { useState, useCallback } from 'react';

// ----------------------------------------------------------------------

const defaultFilters = {
  applicationId: '',
  status: 'all',
  startDate: null,
  endDate: null,
};

export function useApplicationFilters() {
  const [filters, setFilters] = useState(defaultFilters);

  const [openDateRange, setOpenDateRange] = useState(false);

  const handleOpenDateRange = useCallback(() => {
    setOpenDateRange(true);
  }, []);

  const handleCloseDateRange = useCallback(() => {
    setOpenDateRange(false);
  }, []);

  const handleChangeFilters = useCallback((name, value) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const canReset = Object.keys(defaultFilters).some((key) => {
    if (key === 'startDate' || key === 'endDate') {
      return filters[key] !== null;
    }
    return filters[key] !== defaultFilters[key];
  });

  const dateError = filters.startDate && filters.endDate 
    ? dayjs(filters.endDate).isBefore(dayjs(filters.startDate))
    : false;

  return {
    filters,
    setFilters,
    dateError,
    canReset,
    onResetFilters: handleResetFilters,
    onChangeFilters: handleChangeFilters,
    //
    openDateRange,
    onOpenDateRange: handleOpenDateRange,
    onCloseDateRange: handleCloseDateRange,
  };
} 