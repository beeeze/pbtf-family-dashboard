import { format, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

export interface FiscalYear {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

export function getCurrentFiscalYear(): FiscalYear {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Fiscal year runs Oct 1 - Sep 30
  // If Oct-Dec (months 9-11), FY is current year to next year
  // If Jan-Sep (months 0-8), FY is previous year to current year
  if (currentMonth >= 9) {
    return {
      label: `FY ${currentYear + 1}`,
      value: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(currentYear, 9, 1), // Oct 1
      endDate: new Date(currentYear + 1, 8, 30), // Sep 30
    };
  } else {
    return {
      label: `FY ${currentYear}`,
      value: `${currentYear - 1}-${currentYear}`,
      startDate: new Date(currentYear - 1, 9, 1), // Oct 1
      endDate: new Date(currentYear, 8, 30), // Sep 30
    };
  }
}

export function getFiscalYears(): FiscalYear[] {
  const current = getCurrentFiscalYear();
  const years: FiscalYear[] = [current];

  // Add 3 previous fiscal years
  for (let i = 1; i <= 3; i++) {
    const startYear = current.startDate.getFullYear() - i;
    years.push({
      label: `FY ${startYear + 1}`,
      value: `${startYear}-${startYear + 1}`,
      startDate: new Date(startYear, 9, 1),
      endDate: new Date(startYear + 1, 8, 30),
    });
  }

  return years;
}

export function isDateInFiscalYear(date: Date, fiscalYear: FiscalYear): boolean {
  return isWithinInterval(date, { start: fiscalYear.startDate, end: fiscalYear.endDate });
}

export function getFiscalYearMonths(fiscalYear: FiscalYear): { month: string; start: Date; end: Date }[] {
  const months = eachMonthOfInterval({ start: fiscalYear.startDate, end: fiscalYear.endDate });
  return months.map(month => ({
    month: format(month, 'MMM'),
    start: startOfMonth(month),
    end: endOfMonth(month),
  }));
}

export function formatFiscalYearRange(fiscalYear: FiscalYear): string {
  return `${format(fiscalYear.startDate, 'MMM d, yyyy')} - ${format(fiscalYear.endDate, 'MMM d, yyyy')}`;
}
