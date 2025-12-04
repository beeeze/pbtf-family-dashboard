import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiscalYear, formatFiscalYearRange } from '@/lib/fiscalYear';
import { Calendar } from 'lucide-react';

interface FiscalYearSelectorProps {
  fiscalYears: FiscalYear[];
  selectedYear: FiscalYear;
  onYearChange: (year: FiscalYear) => void;
}

export function FiscalYearSelector({ fiscalYears, selectedYear, onYearChange }: FiscalYearSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Fiscal Year</span>
      </div>
      <Select 
        value={selectedYear.value} 
        onValueChange={(value) => {
          const year = fiscalYears.find(fy => fy.value === value);
          if (year) onYearChange(year);
        }}
      >
        <SelectTrigger className="w-36 bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fiscalYears.map((fy) => (
            <SelectItem key={fy.value} value={fy.value}>
              {fy.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        ({formatFiscalYearRange(selectedYear)})
      </span>
    </div>
  );
}
