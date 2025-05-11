import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '', ...props }) => {
  return (
    <div className={`w-full h-3 bg-gray-800 rounded-full overflow-hidden ${className}`} {...props}>
      <div
        className="h-full bg-blue-500 transition-all duration-200"
        style={{ width: `${value}%` }}
      />
    </div>
  );
};
