import React from 'react';

interface InputGroupProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  options?: string[];
  suffix?: string;
  required?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  options,
  suffix,
  required = false,
}) => {
  return (
    <div className="flex flex-col space-y-1.5 group">
      <label htmlFor={name} className="text-sm font-semibold text-slate-600 group-focus-within:text-blue-600 transition-colors">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {options ? (
          <div className="relative">
            <select
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 appearance-none font-medium"
              required={required}
            >
              <option value="" disabled>Select {label}</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
           </div>
          </div>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium shadow-sm"
            required={required}
          />
        )}
        {suffix && !options && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-slate-400 text-sm font-medium bg-slate-50/50 pl-2">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};