import React from 'react';
import clsx from 'clsx';

const Input = ({ 
  className = '',
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  value,
  ...props 
}) => {
  const baseClasses = 'flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const classes = clsx(
    baseClasses,
    error && 'border-danger-500 focus-visible:ring-danger-500',
    className
  );

  // Ensure value is never undefined to prevent controlled/uncontrolled warning
  const safeValue = value === undefined || value === null ? '' : value;

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={classes}
        disabled={disabled}
        value={safeValue}
        {...props}
      />
      {error && (
        <p className="text-sm text-danger-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-secondary-600">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
