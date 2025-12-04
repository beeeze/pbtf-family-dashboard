// Mock data for development - will be replaced with API integration
import { FiscalYear, getFiscalYearMonths, isDateInFiscalYear, getCurrentFiscalYear } from './fiscalYear';

export interface PatientFamily {
  id: number;
  contactName: string;
  createdDate: Date;
  tags: string[];
  individuals: Individual[];
  engagements: FamilyEngagement[];
  notes: ContactNote[];
}

export interface Individual {
  id: number;
  name: string;
  relationship: string;
  diagnosisDate?: Date;
  treatmentFacility?: string;
  tumorType?: string;
}

export interface FamilyEngagement {
  id: number;
  contactId: number;
  type: string;
  createdDate: Date;
  participationDate: Date;
  amount?: number;
  photoRelease: boolean;
  comments?: string;
}

export interface ContactNote {
  id: number;
  contactId: number;
  type: string;
  content: string;
  createdDate: Date;
  staffMember: string;
}

// Generate mock patient families with data spanning relevant fiscal years
function generateMockData(): PatientFamily[] {
  const engagementTypes = ['Ride for Kids', 'Butterfly Fund', 'Uber Program', 'Peer Support', 'Webinar', 'Support Call'];
  const tumorTypes = ['Medulloblastoma', 'Glioma', 'Ependymoma', 'ATRT', 'DIPG', 'Craniopharyngioma'];
  const facilities = ['Children\'s Hospital', 'St. Jude', 'Dana-Farber', 'CHOP', 'Texas Children\'s', 'Seattle Children\'s'];
  const staffMembers = ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim'];

  const families: PatientFamily[] = [];
  const currentFY = getCurrentFiscalYear();
  
  // Generate dates that span the last 4 fiscal years (including current)
  const generateRelevantDate = (bias: 'recent' | 'older' | 'any' = 'any') => {
    const baseYear = currentFY.startDate.getFullYear();
    let yearOffset: number;
    
    if (bias === 'recent') {
      yearOffset = Math.random() > 0.5 ? 0 : -1;
    } else if (bias === 'older') {
      yearOffset = -Math.floor(Math.random() * 3) - 1;
    } else {
      yearOffset = -Math.floor(Math.random() * 4);
    }
    
    const year = baseYear + yearOffset;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    return new Date(year, month, day);
  };

  for (let i = 1; i <= 850; i++) {
    const createdDate = generateRelevantDate('any');
    
    const individuals: Individual[] = [];
    const numIndividuals = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numIndividuals; j++) {
      const diagnosisDate = j === 0 ? generateRelevantDate(Math.random() > 0.7 ? 'recent' : 'any') : undefined;

      individuals.push({
        id: i * 10 + j,
        name: `Individual ${i}-${j + 1}`,
        relationship: j === 0 ? 'Patient' : ['Parent', 'Sibling', 'Grandparent'][Math.floor(Math.random() * 3)],
        diagnosisDate,
        treatmentFacility: j === 0 ? facilities[Math.floor(Math.random() * facilities.length)] : undefined,
        tumorType: j === 0 ? tumorTypes[Math.floor(Math.random() * tumorTypes.length)] : undefined,
      });
    }

    const engagements: FamilyEngagement[] = [];
    const hasEngagement = Math.random() > 0.25; // 75% have engagements
    
    if (hasEngagement) {
      const numEngagements = Math.floor(Math.random() * 5) + 1;
      for (let k = 0; k < numEngagements; k++) {
        const engagementDate = generateRelevantDate('recent');
        engagements.push({
          id: i * 100 + k,
          contactId: i,
          type: engagementTypes[Math.floor(Math.random() * engagementTypes.length)],
          createdDate: engagementDate,
          participationDate: engagementDate,
          amount: Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 50 : undefined,
          photoRelease: Math.random() > 0.3,
        });
      }
    }

    const notes: ContactNote[] = [];
    const hasNotes = Math.random() > 0.4;
    
    if (hasNotes) {
      const numNotes = Math.floor(Math.random() * 8) + 1;
      for (let l = 0; l < numNotes; l++) {
        notes.push({
          id: i * 1000 + l,
          contactId: i,
          type: 'Call',
          content: 'Support call discussion',
          createdDate: generateRelevantDate('recent'),
          staffMember: staffMembers[Math.floor(Math.random() * staffMembers.length)],
        });
      }
    }

    families.push({
      id: i,
      contactName: `Family ${i}`,
      createdDate,
      tags: ['patient family'],
      individuals,
      engagements,
      notes,
    });
  }

  return families;
}

export const mockFamilies = generateMockData();

// Dashboard calculation functions
export function calculateDashboardMetrics(families: PatientFamily[], fiscalYear: FiscalYear) {
  const totalFamilies = families.length;
  
  const engagedFamilies = families.filter(f => 
    f.engagements.some(e => isDateInFiscalYear(e.createdDate, fiscalYear))
  );
  
  const notEngagedFamilies = families.filter(f => 
    !f.engagements.some(e => isDateInFiscalYear(e.createdDate, fiscalYear))
  );

  const newlyDiagnosed = families.filter(f =>
    f.individuals.some(ind => 
      ind.diagnosisDate && isDateInFiscalYear(ind.diagnosisDate, fiscalYear)
    )
  );

  // Total interactions in fiscal year
  const allEngagements = families.flatMap(f => f.engagements);
  const fyEngagements = allEngagements.filter(e => isDateInFiscalYear(e.createdDate, fiscalYear));

  // Support type breakdown
  const butterflyFund = fyEngagements.filter(e => e.type === 'Butterfly Fund').length;
  const uberProgram = fyEngagements.filter(e => e.type === 'Uber Program').length;
  const rideForKids = fyEngagements.filter(e => e.type === 'Ride for Kids').length;
  const peerSupport = fyEngagements.filter(e => e.type === 'Peer Support').length;
  const webinars = fyEngagements.filter(e => e.type === 'Webinar').length;

  // New vs Returning
  const newFamilies = families.filter(f => 
    isDateInFiscalYear(f.createdDate, fiscalYear) &&
    f.engagements.some(e => isDateInFiscalYear(e.createdDate, fiscalYear))
  );

  const returningFamilies = engagedFamilies.filter(f => !newFamilies.includes(f));

  // Support calls
  const allNotes = families.flatMap(f => f.notes);
  const fySupportCalls = allNotes.filter(n => 
    n.type === 'Call' && isDateInFiscalYear(n.createdDate, fiscalYear)
  );

  // Monthly trend data
  const monthlyData = getFiscalYearMonths(fiscalYear).map(({ month, start, end }) => {
    const monthEngagements = fyEngagements.filter(e => 
      e.createdDate >= start && e.createdDate <= end
    );
    const monthNewFamilies = newFamilies.filter(f =>
      f.createdDate >= start && f.createdDate <= end
    );
    return {
      month,
      interactions: monthEngagements.length,
      newFamilies: monthNewFamilies.length,
    };
  });

  return {
    totalFamilies,
    engagedCount: engagedFamilies.length,
    notEngagedCount: notEngagedFamilies.length,
    newlyDiagnosedCount: newlyDiagnosed.length,
    totalInteractions: fyEngagements.length,
    familiesReached: new Set(fyEngagements.map(e => e.contactId)).size,
    newFamiliesCount: newFamilies.length,
    returningFamiliesCount: returningFamilies.length,
    supportTypes: {
      butterflyFund,
      uberProgram,
      rideForKids,
      peerSupport,
      webinars,
    },
    supportCalls: fySupportCalls.length,
    monthlyData,
  };
}
