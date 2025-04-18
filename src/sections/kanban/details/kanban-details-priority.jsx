import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function KanbanDetailsPriority({ priority, onChangePriority, sx, ...other }) {
  return (
    <Box
      sx={[
        () => ({ gap: 1, display: 'flex', flexWrap: 'wrap' }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {['low', 'medium', 'high'].map((option) => (
        <ButtonBase
          key={option}
          onClick={() => onChangePriority(option)}
          sx={(theme) => ({
            py: 0.5,
            pl: 0.75,
            pr: 1.25,
            fontSize: 12,
            borderRadius: 1,
            lineHeight: '20px',
            textTransform: 'capitalize',
            fontWeight: 'fontWeightBold',
            boxShadow: `inset 0 0 0 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
            ...(option === priority && {
              boxShadow: `inset 0 0 0 2px ${theme.vars.palette.text.primary}`,
            }),
          })}
        >
          <Iconify
            icon={
              (option === 'low' && 'solar:double-alt-arrow-down-bold-duotone') ||
              (option === 'medium' && 'solar:double-alt-arrow-right-bold-duotone') ||
              'solar:double-alt-arrow-up-bold-duotone'
            }
            sx={{
              mr: 0.5,
              ...(option === 'low' && { color: 'info.main' }),
              ...(option === 'medium' && { color: 'warning.main' }),
              ...(option === 'high' && { color: 'error.main' }),
            }}
          />

          {option}
        </ButtonBase>
      ))}
    </Box>
  );
}
