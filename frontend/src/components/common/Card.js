import React from 'react';
import clsx from 'clsx';

const Card = ({ 
  children, 
  className = '',
  padding = 'normal',
  shadow = 'sm',
  border = true,
  ...props 
}) => {
  const baseClasses = 'rounded-lg bg-white';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8'
  };
  
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const borders = {
    true: 'border border-secondary-200',
    false: ''
  };

  const classes = clsx(
    baseClasses,
    paddings[padding],
    shadows[shadow],
    borders[border],
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
