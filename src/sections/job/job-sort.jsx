import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const JOB_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
];

// ----------------------------------------------------------------------

export function JobSort({ sort, onSort, sortOptions = JOB_SORT_OPTIONS }) {
  const menuActions = usePopover();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{
        paper: {
          sx: { width: 140 },
        },
      }}
    >
      <MenuList>
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === sort}
            onClick={() => {
              menuActions.onClose();
              onSort(option.value);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
  );

  const selectedOption = sortOptions.find((option) => option.value === sort)?.label || '';

  return (
    <>
      <Button
        disableRipple
        color="inherit"
        onClick={menuActions.onOpen}
        endIcon={
          <Iconify
            icon={menuActions.open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
          />
        }
        sx={{ fontWeight: 'fontWeightSemiBold' }}
      >
        Sort by:
        <Box
          component="span"
          sx={{ ml: 0.5, fontWeight: 'fontWeightBold', textTransform: 'capitalize' }}
        >
          {selectedOption}
        </Box>
      </Button>

      {renderMenuActions()}
    </>
  );
}
