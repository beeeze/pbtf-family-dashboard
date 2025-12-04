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
import { Download, Search, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface PatientFamily {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdDate?: string;
}

interface PatientFamiliesTableProps {
  families: PatientFamily[];
}

export function PatientFamiliesTable({ families }: PatientFamiliesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredFamilies = families.filter((family) =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (family.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (family.contactName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayedFamilies = filteredFamilies;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Name', 'Created Date', 'Email', 'Phone', 'Address'];
    const csvContent = [
      headers.join(','),
      ...families.map((family) =>
        [
          family.id,
          `"${(family.name || '').replace(/"/g, '""')}"`,
          `"${(family.createdDate || '').replace(/"/g, '""')}"`,
          `"${(family.email || '').replace(/"/g, '""')}"`,
          `"${(family.phone || '').replace(/"/g, '""')}"`,
          `"${(family.address || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_families_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Patient Families</CardTitle>
              <span className="text-sm text-muted-foreground">
                ({families.length} total)
              </span>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-3">
            <Button onClick={downloadCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All ({families.length})
            </Button>
          </div>
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
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedFamilies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No families match your search' : 'No patient families found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedFamilies.map((family) => (
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
                        <TableCell className="font-medium">{family.name || family.contactName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(family.createdDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {family.email || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {family.phone || '-'}
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
