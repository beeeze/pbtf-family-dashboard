import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent';
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default',
  className 
}: KPICardProps) {
  return (
    <div 
      className={cn(
        'rounded-xl border p-6 animate-fade-in shadow-sm hover:shadow-md transition-shadow duration-200',
        variant === 'default' && 'bg-card border-border/60',
        variant === 'primary' && 'bg-primary text-primary-foreground border-primary/80',
        variant === 'accent' && 'bg-accent/15 border-accent/40',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            'text-sm font-medium',
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold tracking-tight',
            variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs',
              variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'stat-positive' : 'stat-negative'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground text-xs">vs last year</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'p-3 rounded-lg',
            variant === 'primary' 
              ? 'bg-primary-foreground/10' 
              : variant === 'accent'
              ? 'bg-accent/20'
              : 'bg-muted'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              variant === 'primary' ? 'text-primary-foreground' : 'text-primary'
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
