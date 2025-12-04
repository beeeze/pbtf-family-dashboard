import { FiscalYearSelector } from '@/components/dashboard/FiscalYearSelector';
import { FiscalYear } from '@/lib/fiscalYear';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  fiscalYears: FiscalYear[];
  selectedYear: FiscalYear;
  onYearChange: (year: FiscalYear) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Header({ 
  title, 
  subtitle, 
  fiscalYears, 
  selectedYear, 
  onYearChange,
  onRefresh,
  isLoading 
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <FiscalYearSelector 
            fiscalYears={fiscalYears}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
          />
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
