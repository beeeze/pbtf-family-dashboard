import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

// Contact from ByTag endpoint (basic info)
interface VirtuousContactBasic {
  id: number;
  name: string;
  contactType?: string;
  createdDate?: string;
  tags?: { id: number; name: string }[];
}

// Full contact details (only needed for detailed view)
interface ContactDetails {
  id: number;
  name: string;
  createDateTimeUtc?: string;
  contactType?: string;
  tags?: { id: number; name: string }[];
  contactIndividuals?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    createDateTimeUtc?: string;
    contactMethods?: { type: string; value: string }[];
  }[];
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal?: string;
  };
  customCollections?: Record<string, unknown[]>;
  customFields?: { name: string; value: string }[];
}

export interface PatientFamilyBasic {
  id: number;
  name: string;
  contactType?: string;
  createdDate?: string;
  tags?: { id: number; name: string }[];
}

export interface EnrichedContact {
  id: number;
  name: string;
  createDateTimeUtc?: string;
  contactType?: string;
  email?: string;
  phone?: string;
  address?: string;
  tags?: { id: number; name: string }[];
  contactIndividuals?: ContactDetails['contactIndividuals'];
  customCollections?: Record<string, unknown[]>;
  customFields?: { name: string; value: string }[];
}

export function useAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);

  const callVirtuousAPI = useCallback(async (
    endpoint: string,
    method: string = 'GET',
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>
  ) => {
    try {
      const data = await apiClient.callVirtuousAPI(endpoint, method, body, queryParams);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(message);
    }
  }, []);

  // Fetch all contacts by tag with pagination (basic info only)
  const fetchAllPatientFamilies = useCallback(async (
    tagId: number = 25,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ families: PatientFamilyBasic[]; total: number }> => {
    setIsLoading(true);
    setError(null);

    try {
      const allFamilies: PatientFamilyBasic[] = [];
      let skip = 0;
      const take = 1000;
      let total = 0;

      // First request to get total count
      const firstResponse = await callVirtuousAPI(`/Contact/ByTag/${tagId}`, 'GET', undefined, { skip: '0', take: String(take) });
      total = firstResponse?.total || 0;
      
      const firstBatch = (firstResponse?.list || []).map((c: VirtuousContactBasic) => ({
        id: c.id,
        name: c.name,
        contactType: c.contactType,
        createdDate: c.createdDate,
        tags: c.tags,
      }));
      allFamilies.push(...firstBatch);
      
      console.log(`Fetched first batch: ${allFamilies.length} of ${total} contacts`);
      onProgress?.(allFamilies.length, total);
      setLoadingProgress({ current: allFamilies.length, total });

      // Fetch remaining pages if needed
      while (allFamilies.length < total) {
        skip += take;
        console.log(`Fetching batch starting at ${skip}...`);
        const response = await callVirtuousAPI(`/Contact/ByTag/${tagId}`, 'GET', undefined, { skip: String(skip), take: String(take) });
        const newContacts = (response?.list || []).map((c: VirtuousContactBasic) => ({
          id: c.id,
          name: c.name,
          contactType: c.contactType,
          createdDate: c.createdDate,
          tags: c.tags,
        }));
        
        if (newContacts.length === 0) break;
        allFamilies.push(...newContacts);
        
        console.log(`Fetched ${allFamilies.length} of ${total} contacts`);
        onProgress?.(allFamilies.length, total);
        setLoadingProgress({ current: allFamilies.length, total });
      }

      setLoadingProgress(null);
      return { families: allFamilies, total };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callVirtuousAPI]);

  // Fetch contact details in batches to get createDateTimeUtc
  const fetchContactDetailsInBatches = useCallback(async (
    contactIds: number[],
    batchSize: number = 3,
    delayMs: number = 300,
    onProgress?: (fetched: number, total: number) => void,
    onBatchComplete?: (contacts: EnrichedContact[]) => void
  ): Promise<EnrichedContact[]> => {
    setIsLoading(true);
    setError(null);
    
    const allDetails: EnrichedContact[] = [];
    const total = contactIds.length;
    
    try {
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batch = contactIds.slice(i, i + batchSize);
        console.log(`Fetching contact details batch ${Math.floor(i / batchSize) + 1}: IDs ${batch.join(', ')}`);
        
        // Fetch batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (id) => {
            try {
              const response: ContactDetails = await callVirtuousAPI(`/Contact/${id}`);
              
              const primaryIndividual = response.contactIndividuals?.[0];
              let email = '';
              let phone = '';
              
              if (primaryIndividual?.contactMethods) {
                const emailMethod = primaryIndividual.contactMethods.find(m => 
                  m.type.toLowerCase().includes('email')
                );
                const phoneMethod = primaryIndividual.contactMethods.find(m => 
                  m.type.toLowerCase().includes('phone')
                );
                email = emailMethod?.value || '';
                phone = phoneMethod?.value || '';
              }
              
              const addr = response.address;
              const address = addr 
                ? [addr.address1, addr.city, addr.state, addr.postal].filter(Boolean).join(', ')
                : '';

              return {
                id: response.id,
                name: response.name,
                createDateTimeUtc: response.createDateTimeUtc,
                contactType: response.contactType,
                email,
                phone,
                address,
                tags: response.tags,
                contactIndividuals: response.contactIndividuals,
                customCollections: response.customCollections,
                customFields: response.customFields,
              };
            } catch (err) {
              console.error(`Failed to fetch contact ${id}:`, err);
              return null;
            }
          })
        );
        
        const validResults = batchResults.filter((r) => r !== null) as EnrichedContact[];
        allDetails.push(...validResults);
        
        const fetched = Math.min(i + batchSize, total);
        onProgress?.(fetched, total);
        setLoadingProgress({ current: fetched, total });
        
        // Call batch complete callback for incremental updates
        if (onBatchComplete && validResults.length > 0) {
          onBatchComplete(validResults);
        }
        
        // Delay between batches to avoid rate limiting
        if (i + batchSize < contactIds.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      setLoadingProgress(null);
      return allDetails;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callVirtuousAPI]);

  // Fetch full details for a single contact (on-demand)
  const fetchContactDetails = useCallback(async (contactId: number): Promise<EnrichedContact> => {
    const response: ContactDetails = await callVirtuousAPI(`/Contact/${contactId}`);
    
    // Extract primary email and phone from contactIndividuals
    const primaryIndividual = response.contactIndividuals?.[0];
    let email = '';
    let phone = '';
    
    if (primaryIndividual?.contactMethods) {
      const emailMethod = primaryIndividual.contactMethods.find(m => 
        m.type.toLowerCase().includes('email')
      );
      const phoneMethod = primaryIndividual.contactMethods.find(m => 
        m.type.toLowerCase().includes('phone')
      );
      email = emailMethod?.value || '';
      phone = phoneMethod?.value || '';
    }
    
    // Format address
    const addr = response.address;
    const address = addr 
      ? [addr.address1, addr.city, addr.state, addr.postal].filter(Boolean).join(', ')
      : '';

    return {
      id: response.id,
      name: response.name,
      createDateTimeUtc: response.createDateTimeUtc,
      contactType: response.contactType,
      email,
      phone,
      address,
      tags: response.tags,
      contactIndividuals: response.contactIndividuals,
      customCollections: response.customCollections,
      customFields: response.customFields,
    };
  }, [callVirtuousAPI]);

  // Quick fetch for initial display (first batch only)
  const fetchPatientFamilies = useCallback(async (tagId: number = 25) => {
    const response = await callVirtuousAPI(`/Contact/ByTag/${tagId}`, 'GET', undefined, { skip: '0', take: '1000' });
    return {
      list: response?.list || [],
      total: response?.total || response?.list?.length || 0
    };
  }, [callVirtuousAPI]);

  const fetchFamilyEngagements = useCallback(async (contactId: number) => {
    const response = await callVirtuousAPI(`/Contact/${contactId}/CustomCollections/Family Engagement`);
    return response;
  }, [callVirtuousAPI]);

  const fetchContactNotes = useCallback(async (contactId: number) => {
    const response = await callVirtuousAPI(`/Contact/${contactId}/ContactNotes`);
    return response;
  }, [callVirtuousAPI]);

  const fetchAllTags = useCallback(async () => {
    const response = await callVirtuousAPI('/Tag', 'GET', undefined, { skip: '0', take: '100' });
    return response;
  }, [callVirtuousAPI]);

  const searchTags = useCallback(async (searchText: string) => {
    const response = await callVirtuousAPI('/Tag/Search', 'POST', { searchText }, { skip: '0', take: '50' });
    return response;
  }, [callVirtuousAPI]);

  const fetchContactsByTag = useCallback(async (tagId: number) => {
    const response = await callVirtuousAPI(`/Contact/ByTag/${tagId}`, 'GET', undefined, { skip: '0', take: '100' });
    return response;
  }, [callVirtuousAPI]);

  return {
    isLoading,
    error,
    loadingProgress,
    callVirtuousAPI,
    fetchPatientFamilies,
    fetchAllPatientFamilies,
    fetchContactDetailsInBatches,
    fetchContactDetails,
    fetchFamilyEngagements,
    fetchContactNotes,
    fetchAllTags,
    searchTags,
    fetchContactsByTag,
  };
}
