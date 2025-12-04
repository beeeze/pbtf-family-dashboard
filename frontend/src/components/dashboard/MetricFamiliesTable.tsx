import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Search, ChevronDown, ChevronRight, UserCheck, UserPlus, RefreshCcw, Heart } from 'lucide-react';
import { format } from 'date-fns';

export interface FamilyListItem {
  id: number;
  name: string;
  email: string | null;
  createdDate: string | null;
  engagementDate?: string | null;
}

interface MetricFamiliesTableProps {
  title: string;
  subtitle: string;
  families: FamilyListItem[];
  variant: 'engaged' | 'newlyDiagnosed' | 'newFamilies' | 'firstTimeEngaged' | 'reEngaged';
}

const variantConfig = {
  engaged: { icon: UserCheck, color: 'text-primary' },
  newlyDiagnosed: { icon: Heart, color: 'text-orange-500' },
  newFamilies: { icon: UserPlus, color: 'text-emerald-500' },
  firstTimeEngaged: { icon: UserCheck, color: 'text-blue-500' },
  reEngaged: { icon: RefreshCcw, color: 'text-purple-500' },
};

export function MetricFamiliesTable({ title, subtitle, families, variant }: MetricFamiliesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const filteredFamilies = families.filter((family) =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (family.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.trim() === '') return 'No date';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const showEngagementDate = variant === 'newFamilies' || variant === 'engaged' || variant === 'firstTimeEngaged' || variant === 'reEngaged';

  const downloadCSV = () => {
    const headers = showEngagementDate 
      ? ['ID', 'Name', 'Email', 'Created Date', 'Engagement Date']
      : ['ID', 'Name', 'Email', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...families.map((family) => {
        const baseFields = [
          family.id,
          `"${(family.name || '').replace(/"/g, '""')}"`,
          `"${(family.email || '').replace(/"/g, '""')}"`,
          `"${(family.createdDate || '').replace(/"/g, '""')}"`,
        ];
        if (showEngagementDate) {
          baseFields.push(`"${(family.engagementDate || '').replace(/"/g, '""')}"`);
        }
        return baseFields.join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${variant}_families_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (families.length === 0) return null;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <Icon className={`h-5 w-5 ${config.color}`} />
              <div className="text-left">
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">{subtitle}</p>
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                ({families.length})
              </span>
            </button>
          </CollapsibleTrigger>
          <Button onClick={downloadCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download ({families.length})
          </Button>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search families..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full max-w-sm"
                />
              </div>
            </div>
            <div className="rounded-md border max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created Date</TableHead>
                    {showEngagementDate && <TableHead>Engagement Date</TableHead>}
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showEngagementDate ? 5 : 4} className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No families match your search' : 'No families found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFamilies.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell>
                          <a
                            href={`https://app.virtuoussoftware.com/Generosity/Contact/View/${family.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {family.id}
                          </a>
                        </TableCell>
                        <TableCell className="font-medium">{family.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(family.createdDate)}
                        </TableCell>
                        {showEngagementDate && (
                          <TableCell className="text-muted-foreground">
                            {formatDate(family.engagementDate || null)}
                          </TableCell>
                        )}
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {family.email || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
