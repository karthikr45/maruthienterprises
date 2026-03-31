import React from 'react';

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export function Table({ className = '', children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-sm text-left ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className = '', children }: TableProps) {
  return (
    <thead
      className={`bg-morning-100 text-xs text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children }: TableProps) {
  return <tbody className={`divide-y divide-gray-200 ${className}`}>{children}</tbody>;
}

export function TableRow({ className = '', children }: TableProps) {
  return (
    <tr className={`hover:bg-morning-100/50 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

interface TableCellProps extends TableProps {
  isHeader?: boolean;
}

export function TableCell({
  isHeader = false,
  className = '',
  children,
}: TableCellProps) {
  const Tag = isHeader ? 'th' : 'td';
  return (
    <Tag
      className={`px-6 py-3 ${
        isHeader
          ? 'font-medium text-gray-500'
          : 'text-gray-900'
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
