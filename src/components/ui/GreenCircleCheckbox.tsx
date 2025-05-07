import React from 'react';

interface GreenCircleCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const GreenCircleCheckbox: React.FC<GreenCircleCheckboxProps> = ({ checked, onChange, className }) => {
  return (
    <label className={`relative inline-flex items-center cursor-pointer group ${className || ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        aria-checked={checked}
        aria-label="Select"
      />
      <span
        className={
          `w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150
          ${checked ? 'bg-green-500 border-green-600' : 'bg-black border-white'}
          peer-hover:border-orange-500 group-hover:border-orange-500
          shadow-sm group-hover:shadow-orange-200
          `
        }
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l3 3 5-5" />
          </svg>
        )}
      </span>
    </label>
  );
};

export default GreenCircleCheckbox; 