import React from 'react';
import clsx from 'clsx';

const StatusBadge = ({ status, className = '', size = 'sm', text }) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      classes: 'bg-warning-100 text-warning-800'
    },
    in_progress: {
      label: 'En Progreso',
      classes: 'bg-primary-100 text-primary-800'
    },
    completed: {
      label: 'Completado',
      classes: 'bg-success-100 text-success-800'
    },
    cancelled: {
      label: 'Cancelado',
      classes: 'bg-danger-100 text-danger-800'
    },
    on_hold: {
      label: 'En Pausa',
      classes: 'bg-warning-100 text-warning-800'
    },
    approved: {
      label: 'Aprobado',
      classes: 'bg-success-100 text-success-800'
    },
    rejected: {
      label: 'Rechazado',
      classes: 'bg-danger-100 text-danger-800'
    },
    rework: {
      label: 'Rework',
      classes: 'bg-warning-100 text-warning-800'
    },
    open: {
      label: 'Abierto',
      classes: 'bg-danger-100 text-danger-800'
    },
    investigating: {
      label: 'Investigando',
      classes: 'bg-warning-100 text-warning-800'
    },
    resolved: {
      label: 'Resuelto',
      classes: 'bg-success-100 text-success-800'
    },
    closed: {
      label: 'Cerrado',
      classes: 'bg-secondary-100 text-secondary-800'
    },
    normal: {
      label: 'Normal',
      classes: 'bg-success-100 text-success-800'
    },
    low: {
      label: 'Bajo',
      classes: 'bg-warning-100 text-warning-800'
    },
    critical: {
      label: 'Crítico',
      classes: 'bg-danger-100 text-danger-800'
    },
    overstock: {
      label: 'Sobrestock',
      classes: 'bg-warning-100 text-warning-800'
    },
    success: {
      label: 'Éxito',
      classes: 'bg-success-100 text-success-800'
    },
    error: {
      label: 'Error',
      classes: 'bg-danger-100 text-danger-800'
    },
    warning: {
      label: 'Advertencia',
      classes: 'bg-warning-100 text-warning-800'
    },
    info: {
      label: 'Información',
      classes: 'bg-primary-100 text-primary-800'
    }
  };

  const config = statusConfig[status] || {
    label: text || status,
    classes: 'bg-secondary-100 text-secondary-800'
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const classes = clsx(
    'inline-flex items-center rounded-full font-medium',
    sizes[size],
    config.classes,
    className
  );

  return (
    <span className={classes}>
      {text || config.label}
    </span>
  );
};

export default StatusBadge;
