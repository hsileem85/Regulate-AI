import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        pending_acceptance: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        accepted: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
        validating: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
        submitted: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
        overdue: "bg-destructive/10 text-destructive border border-destructive/20",
        draft: "bg-muted text-muted-foreground border border-border",
        published: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
        default: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
}

export function StatusBadge({ className, status, label, ...props }: StatusBadgeProps) {
  const displayLabel = label || (status ? status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');
  
  return (
    <div className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span className="relative flex h-2 w-2 mr-2">
        {status === 'validating' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", "bg-current")}></span>
      </span>
      {displayLabel}
    </div>
  );
}
