import { useState, useCallback, useEffect } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import useGetFiles from 'src/actions/filemanager';
import { deleteFiles } from 'src/actions/filemanager';
import { DashboardContent } from 'src/layouts/dashboard';
import { _allFiles, FILE_TYPE_OPTIONS } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { fileFormat } from 'src/components/file-thumbnail';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, rowInPage, getComparator } from 'src/components/table';

import { FileManagerTable } from '../file-manager-table';
import { FileManagerFilters } from '../file-manager-filters';
import { FileManagerGridView } from '../file-manager-grid-view';
import { FileManagerFiltersResult } from '../file-manager-filters-result';
import { FileManagerNewFolderDialog } from '../file-manager-new-folder-dialog';

// ----------------------------------------------------------------------

export function FileManagerView() {
  const table = useTable({ defaultRowsPerPage: 10 });

  const dateRange = useBoolean();
  const confirmDialog = useBoolean();
  const newFilesDialog = useBoolean();

  const [displayMode, setDisplayMode] = useState('list');

  const userId = 'cb7288da-aa6c-42df-a28a-86bd994296aa';
  const { data, isLoading, isError } = useGetFiles(userId);
  const [tableData, setTableData] = useState([]);

  // ✅ Update tableData when data changes
  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(tableData)) {
      setTableData(data);
    }
  }, [data]);

  const filters = useSetState({
    name: '',
    type: [],
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: () => { },
    filters: currentFilters,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name ||
    currentFilters.type.length > 0 ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleChangeView = useCallback((event, newView) => {
    if (newView !== null) {
      setDisplayMode(newView);
    }
  }, []);

  const handleDeleteItem = useCallback(async (id) => {
    try {
      const result = await deleteFiles(userId, [id]); // API call with single file

      if (result.success) {
        toast.success('File deleted successfully!');

        // ✅ Remove the deleted file from `tableData`
        setTableData((prevData) => prevData.filter((row) => row.id !== id));

        // ✅ Clear selection if this file was selected
        table.setSelected((prevSelected) => prevSelected.filter((selectedId) => selectedId !== id));

        // ✅ Update pagination if needed
        table.onUpdatePageDeleteRow(dataInPage.length);
      } else {
        throw new Error('Failed to delete file.');
      }
    } catch (error) {
      toast.error('Error deleting file.');
      console.error(error);
    }
  }, [userId, tableData]);


  const handleDeleteItems = useCallback(async () => {
    if (!table.selected.length) {
      toast.error('No files selected for deletion.');
      return;
    }

    try {
      const result = await deleteFiles(userId, table.selected);

      if (result.success) {
        toast.success('Files deleted successfully!');
        table.setSelected([]);

        // ✅ Remove deleted items from tableData
        setTableData((prevData) => prevData.filter((row) => !table.selected.includes(row.id)));

        // ✅ Update table pagination if needed
        table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
      } else {
        throw new Error('Failed to delete files.');
      }
    } catch (error) {
      toast.error('Error deleting files.');
      console.error(error);
    }
  }, [userId, table.selected,]);

  const renderFilters = () => (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-end', md: 'center' },
      }}
    >
      <FileManagerFilters
        filters={filters}
        dateError={dateError}
        onResetPage={table.onResetPage}
        openDateRange={dateRange.value}
        onOpenDateRange={dateRange.onTrue}
        onCloseDateRange={dateRange.onFalse}
        options={{ types: FILE_TYPE_OPTIONS }}
      />

      <ToggleButtonGroup size="small" value={displayMode} exclusive onChange={handleChangeView}>
        <ToggleButton value="list">
          <Iconify icon="solar:list-bold" />
        </ToggleButton>

        <ToggleButton value="grid">
          <Iconify icon="mingcute:dot-grid-fill" />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );

  const renderResults = () => (
    <FileManagerFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      onResetPage={table.onResetPage}
    />
  );

  const renderNewFilesDialog = () => (
    < FileManagerNewFolderDialog open={newFilesDialog.value} onClose={newFilesDialog.onFalse} userId={userId} />
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> items?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteItems();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  const renderList = () =>
    displayMode === 'list' ? (
      <FileManagerTable
        table={table}
        dataFiltered={dataFiltered}
        onDeleteRow={handleDeleteItem}
        notFound={notFound}
        onOpenConfirm={confirmDialog.onTrue}
      />
    ) : (
      <FileManagerGridView
        table={table}
        dataFiltered={dataFiltered}
        onDeleteItem={handleDeleteItem}
        onOpenConfirm={confirmDialog.onTrue}
      />
    );
  if (isError) {
    return (
      <DashboardContent>
        <Typography variant="h4">File Manager</Typography>
        <EmptyContent title="Error Loading Files" description="Something went wrong. Please try again." />
      </DashboardContent>
    );
  }
  if (isLoading) {
    return (
      <DashboardContent>
        <Typography variant="h4">File Manager</Typography>
        <EmptyContent title="Loading files..." />
      </DashboardContent>
    );
  }

  return (
    <>
      <DashboardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4">File manager</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={newFilesDialog.onTrue}
          >
            Upload
          </Button>
        </Box>

        <Stack spacing={2.5} sx={{ my: { xs: 3, md: 5 } }}>
          {renderFilters()}
          {canReset && renderResults()}
        </Stack>

        {notFound ? <EmptyContent filled sx={{ py: 10 }} /> : renderList()}
      </DashboardContent>

      {renderNewFilesDialog()}
      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, type, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((file) => file.name.toLowerCase().includes(name.toLowerCase()));
  }

  if (type.length) {
    inputData = inputData.filter((file) => type.includes(fileFormat(file.type)));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((file) => fIsBetween(file.createdAt, startDate, endDate));
    }
  }

  return inputData;
}
