import { CSS } from '@dnd-kit/utilities';
import { useBoolean } from 'minimal-shared/hooks';
import React, { useCallback, useState, useMemo } from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';

import { Typography, Box } from '@mui/material';

import { createTask, clearColumn, deleteColumn, updateColumn } from 'src/actions/kanban';

import { toast } from 'src/components/snackbar';

import { useAuthContext } from 'src/auth/hooks';

import ColumnBase from './column-base';
import { KanbanTaskItem } from '../item/kanban-task-item';
import { KanbanTaskAdd } from '../components/kanban-task-add';
import { KanbanColumnToolBar } from './kanban-column-toolbar';

// ----------------------------------------------------------------------

const animateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true });

export function KanbanColumn({ children, column, tasks, disabled, sx }) {
  const openAddTask = useBoolean();
  const { user } = useAuthContext();

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transition,
    active,
    over,
    transform,
  } = useSortable({
    id: column.id,
    data: { type: 'container', children: tasks },
    animateLayoutChanges,
  });

  // Modified filtering/grouping logic
  const groupedTasks = useMemo(() => {
    if (!tasks || !user?.id) {
      return { all: tasks || [] };
    }
    
    const grouped = {
      created: [],
      assigned: [],
    };
    
    tasks.forEach((task) => {
      // Check if user created the task
      if (task.reporter?.id === user.id) {
        grouped.created.push(task);
      }
      // Check if task is assigned to user
      else if (Array.isArray(task.assignee) && 
        task.assignee.some((assignee) => assignee?.id === user.id)) {
        grouped.assigned.push(task);
      }
      // We're no longer collecting other tasks
    });

    return grouped;
  }, [tasks, user?.id]);

  // Get all task IDs for drag and drop
  const tasksIds = useMemo(() => 
    [...(groupedTasks.created || []), ...(groupedTasks.assigned || [])].map(task => task.id), 
    [groupedTasks]
  );

  const isOverContainer = useMemo(() => {
    if (!over || !active) return false;
    
    return (column.id === over.id && active?.data.current?.type !== 'container') ||
      tasksIds.includes(over.id);
  }, [over, active, column.id, tasksIds]);

  // Calculate relevant tasks count
  const relevantTasksCount = useMemo(() => {
    if (!tasks || !user?.id) return 0;
    
    return tasks.filter(task => 
      task.reporter?.id === user.id || 
      (Array.isArray(task.assignee) && task.assignee.some(assignee => assignee?.id === user.id))
    ).length;
  }, [tasks, user?.id]);

  const handleUpdateColumn = useCallback(
    async (columnName) => {
      try {
        if (column.name !== columnName) {
          updateColumn(column.id, columnName);
          toast.success('Update success!', { position: 'top-center' });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [column.id, column.name]
  );

  const handleClearColumn = useCallback(async () => {
    try {
      clearColumn(column.id);
    } catch (error) {
      console.error(error);
    }
  }, [column.id]);

  const handleDeleteColumn = useCallback(async () => {
    try {
      deleteColumn(column.id);
      toast.success('Delete success!', { position: 'top-center' });
    } catch (error) {
      console.error(error);
    }
  }, [column.id]);

  const handleAddTask = useCallback(
    async (taskData) => {
      try {
        createTask(column.id, taskData);
        openAddTask.onFalse();
      } catch (error) {
        console.error(error);
      }
    },
    [column.id, openAddTask]
  );

  const renderTasks = (tasksToRender, label = null) => {
    if (!tasksToRender?.length) return null;

    return (
      <Box
        sx={{
          mb: 2,
          borderRadius: 1.5,
          bgcolor: (theme) => theme.palette.background.neutral,
          '&:last-of-type': {
            mb: 0,
          }
        }}
      >
        {label && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1.5,
              display: 'block',
              color: 'text.secondary',
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            {label} ({tasksToRender.length})
          </Typography>
        )}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {tasksToRender.map(task => (
            <KanbanTaskItem
              key={task.id}
              task={task}
              columnId={column.id}
              disabled={disabled}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <ColumnBase
      ref={disabled ? undefined : setNodeRef}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      sx={sx}
      stateProps={{
        dragging: isDragging,
        overContainer: isOverContainer,
        handleProps: { ...attributes, ...listeners },
      }}
      slots={{
        header: (
          <KanbanColumnToolBar
            handleProps={{ ...attributes, ...listeners }}
            totalTasks={relevantTasksCount}
            columnName={column.name}
            onUpdateColumn={handleUpdateColumn}
            onClearColumn={handleClearColumn}
            onDeleteColumn={handleDeleteColumn}
            onToggleAddTask={openAddTask.onToggle}
          />
        ),
        main: React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            if (child.type.name === 'SortableContext') {
              return React.cloneElement(child, {
                items: tasksIds,
                children: (
                  <>
                    {renderTasks(groupedTasks.created, 'Created by me')}
                    {renderTasks(groupedTasks.assigned, 'Assigned to me')}
                  </>
                )
              });
            }
          }
          return child;
        }),
        action: (
          <KanbanTaskAdd
            status={column.name}
            openAddTask={openAddTask.value}
            onAddTask={handleAddTask}
            onCloseAddTask={openAddTask.onFalse}
          />
        ),
      }}
    />
  );
}
