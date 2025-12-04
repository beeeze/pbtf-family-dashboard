import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { apiClient } from '@/lib/apiClient';
import { FiscalYear } from '@/lib/fiscalYear';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface GeographicMappingProps {
  selectedYear: FiscalYear;
}

interface FamilyContact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

// Simple geocoding cache (in production, you'd use a proper geocoding service)
const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  'AL': { lat: 32.806671, lng: -86.791130 },
  'AK': { lat: 61.370716, lng: -152.404419 },
  'AZ': { lat: 33.729759, lng: -111.431221 },
  'AR': { lat: 34.969704, lng: -92.373123 },
  'CA': { lat: 36.116203, lng: -119.681564 },
  'CO': { lat: 39.059811, lng: -105.311104 },
  'CT': { lat: 41.597782, lng: -72.755371 },
  'DE': { lat: 39.318523, lng: -75.507141 },
  'FL': { lat: 27.766279, lng: -81.686783 },
  'GA': { lat: 33.040619, lng: -83.643074 },
  'HI': { lat: 21.094318, lng: -157.498337 },
  'ID': { lat: 44.240459, lng: -114.478828 },
  'IL': { lat: 40.349457, lng: -88.986137 },
  'IN': { lat: 39.849426, lng: -86.258278 },
  'IA': { lat: 42.011539, lng: -93.210526 },
  'KS': { lat: 38.526600, lng: -96.726486 },
  'KY': { lat: 37.668140, lng: -84.670067 },
  'LA': { lat: 31.169546, lng: -91.867805 },
  'ME': { lat: 44.693947, lng: -69.381927 },
  'MD': { lat: 39.063946, lng: -76.802101 },
  'MA': { lat: 42.230171, lng: -71.530106 },
  'MI': { lat: 43.326618, lng: -84.536095 },
  'MN': { lat: 45.694454, lng: -93.900192 },
  'MS': { lat: 32.741646, lng: -89.678696 },
  'MO': { lat: 38.456085, lng: -92.288368 },
  'MT': { lat: 46.921925, lng: -110.454353 },
  'NE': { lat: 41.125370, lng: -98.268082 },
  'NV': { lat: 38.313515, lng: -117.055374 },
  'NH': { lat: 43.452492, lng: -71.563896 },
  'NJ': { lat: 40.298904, lng: -74.521011 },
  'NM': { lat: 34.840515, lng: -106.248482 },
  'NY': { lat: 42.165726, lng: -74.948051 },
  'NC': { lat: 35.630066, lng: -79.806419 },
  'ND': { lat: 47.528912, lng: -99.784012 },
  'OH': { lat: 40.388783, lng: -82.764915 },
  'OK': { lat: 35.565342, lng: -96.928917 },
  'OR': { lat: 44.572021, lng: -122.070938 },
  'PA': { lat: 40.590752, lng: -77.209755 },
  'RI': { lat: 41.680893, lng: -71.511780 },
  'SC': { lat: 33.856892, lng: -80.945007 },
  'SD': { lat: 44.299782, lng: -99.438828 },
  'TN': { lat: 35.747845, lng: -86.692345 },
  'TX': { lat: 31.054487, lng: -97.563461 },
  'UT': { lat: 40.150032, lng: -111.862434 },
  'VT': { lat: 44.045876, lng: -72.710686 },
  'VA': { lat: 37.769337, lng: -78.169968 },
  'WA': { lat: 47.400902, lng: -121.490494 },
  'WV': { lat: 38.491226, lng: -80.954453 },
  'WI': { lat: 44.268543, lng: -89.616508 },
  'WY': { lat: 42.755966, lng: -107.302490 },
  'DC': { lat: 38.897438, lng: -77.026817 },
};

const stateNames: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

function extractState(address: string): string | null {
  if (!address) return null;
  const stateMatch = address.match(/\b([A-Z]{2})\b(?:\s+\d{5})?/);
  if (stateMatch && stateCoordinates[stateMatch[1]]) {
    return stateMatch[1];
  }
  return null;
}

function getColor(count: number): string {
  if (count > 100) return '#dc2626';
  if (count > 50) return '#ea580c';
  if (count > 20) return '#ca8a04';
  if (count > 10) return '#65a30d';
  return '#0d9488';
}

function getRadius(count: number): number {
  if (count > 100) return 30;
  if (count > 50) return 25;
  if (count > 20) return 20;
  if (count > 10) return 15;
  return 10;
}

export function GeographicMapping({ selectedYear }: GeographicMappingProps) {
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});
  const [familiesByState, setFamiliesByState] = useState<Record<string, FamilyContact[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [statesPage, setStatesPage] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const STATES_PER_PAGE = 10;

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        // Fetch ALL families with addresses using pagination
        const allFamilies: FamilyContact[] = [];
        const pageSize = 1000;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await apiClient.getPatientFamilies(offset, pageSize);
          const families = response.families || [];

          if (families.length > 0) {
            // Filter by fiscal year and address availability
            const filtered = families.filter((family: any) => {
              if (!family.address) return false; // Skip if no address
              if (!family.created_date) return true; // Include if no date
              const createdDate = new Date(family.created_date);
              return createdDate >= selectedYear.startDate && createdDate <= selectedYear.endDate;
            });
            
            filtered.forEach((family: any) => {
              allFamilies.push({
                id: family.id,
                name: family.name,
                email: family.email,
                phone: family.phone,
                address: family.address,
              });
            });
            
            offset += pageSize;
            hasMore = families.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        console.log(`Geographic mapping: fetched ${allFamilies.length} families with addresses for ${selectedYear.label}`);

        const counts: Record<string, number> = {};
        const byState: Record<string, FamilyContact[]> = {};

        allFamilies.forEach((family) => {
          const state = extractState(family.address || '');
          if (state && stateCoordinates[state]) {
            counts[state] = (counts[state] || 0) + 1;
            if (!byState[state]) byState[state] = [];
            byState[state].push(family);
          }
        });

        setStateCounts(counts);
        setFamiliesByState(byState);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [selectedYear]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([39.8283, -98.5795], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when stateCounts change
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    Object.entries(stateCounts).forEach(([state, count]) => {
      const coords = stateCoordinates[state];
      if (!coords) return;

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: getRadius(count),
        fillColor: getColor(count),
        color: getColor(count),
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      }).addTo(mapRef.current!);

      marker.bindPopup(`<div class="text-center"><strong class="text-lg">${state}</strong><p class="text-sm">${count} families</p></div>`);
      marker.on('click', () => setSelectedState(state));

      markersRef.current.push(marker);
    });
  }, [stateCounts]);

  const downloadStateCSV = (state: string) => {
    const families = familiesByState[state] || [];
    if (families.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Virtuous Link'];
    const rows = families.map(f => [
      f.id,
      `"${(f.name || '').replace(/"/g, '""')}"`,
      f.email || '',
      f.phone || '',
      `"${(f.address || '').replace(/"/g, '""')}"`,
      `https://app.virtuoussoftware.com/Generosity/Contact/View/${f.id}`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `patient_families_${state}_${selectedYear.label.replace(' ', '_')}.csv`;
    link.click();
  };

  const totalFamilies = Object.values(stateCounts).reduce((sum, c) => sum + c, 0);
  const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
  const totalPages = Math.ceil(sortedStates.length / STATES_PER_PAGE);
  const displayedStates = sortedStates.slice(statesPage * STATES_PER_PAGE, (statesPage + 1) * STATES_PER_PAGE);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-2">Total Mapped Families</h3>
          <p className="text-3xl font-bold text-primary">{totalFamilies.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">with valid addresses</p>
        </div>
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-2">States Covered</h3>
          <p className="text-3xl font-bold text-primary">{Object.keys(stateCounts).length}</p>
          <p className="text-sm text-muted-foreground">across the US</p>
        </div>
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-2">Fiscal Year</h3>
          <p className="text-3xl font-bold text-primary">{selectedYear?.label || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{selectedYear?.startDate ? `${new Date(selectedYear.startDate).toLocaleDateString()} - ${new Date(selectedYear.endDate).toLocaleDateString()}` : 'selected period'}</p>
        </div>
      </div>

      {/* Map and States Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Family Distribution Map</h3>
          <p className="text-sm text-muted-foreground mb-2">Click on a state marker to view families</p>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 h-96 flex items-center justify-center bg-background/80 z-10 rounded-lg">
                <p className="text-muted-foreground">Loading map data...</p>
              </div>
            )}
            <div 
              ref={mapContainerRef} 
              className="h-96 rounded-lg overflow-hidden border border-border"
              style={{ minHeight: '384px' }}
            />
          </div>
        </div>

        {/* States List with Pagination */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">States by Families</h3>
            <span className="text-sm text-muted-foreground">
              {statesPage * STATES_PER_PAGE + 1}-{Math.min((statesPage + 1) * STATES_PER_PAGE, sortedStates.length)} of {sortedStates.length}
            </span>
          </div>
          <div className="space-y-2">
            {displayedStates.map(([state, count], index) => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    {statesPage * STATES_PER_PAGE + index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-foreground">{state}</span>
                    <span className="text-xs text-muted-foreground ml-2">{stateNames[state]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getColor(count) }}
                  />
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
              </button>
            ))}
            {sortedStates.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No location data available</p>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatesPage(p => Math.max(0, p - 1))}
                disabled={statesPage === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {statesPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatesPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={statesPage >= totalPages - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-4">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0d9488' }} />
            <span className="text-sm text-muted-foreground">1-10 families</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#65a30d' }} />
            <span className="text-sm text-muted-foreground">11-20 families</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ca8a04' }} />
            <span className="text-sm text-muted-foreground">21-50 families</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ea580c' }} />
            <span className="text-sm text-muted-foreground">51-100 families</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#dc2626' }} />
            <span className="text-sm text-muted-foreground">100+ families</span>
          </div>
        </div>
      </div>

      {/* State Details Dialog */}
      <Dialog open={!!selectedState} onOpenChange={() => setSelectedState(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedState ? `${stateNames[selectedState]} (${selectedState})` : ''} - {familiesByState[selectedState || '']?.length || 0} Families</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedState && downloadStateCSV(selectedState)}
                className="ml-4"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="text-left p-2 font-semibold">Name</th>
                  <th className="text-left p-2 font-semibold">Email</th>
                  <th className="text-left p-2 font-semibold">Phone</th>
                  <th className="text-left p-2 font-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                {(familiesByState[selectedState || ''] || []).map((family) => (
                  <tr key={family.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <a
                        href={`https://app.virtuoussoftware.com/Generosity/Contact/View/${family.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {family.name}
                      </a>
                    </td>
                    <td className="p-2 text-muted-foreground">{family.email || '-'}</td>
                    <td className="p-2 text-muted-foreground">{family.phone || '-'}</td>
                    <td className="p-2 text-muted-foreground text-xs">{family.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
