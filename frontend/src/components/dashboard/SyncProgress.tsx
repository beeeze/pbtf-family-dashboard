import { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Pause, Play, RotateCcw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/apiClient';

interface SyncProgressProps {
  syncedCount: number;
  totalCount: number;
  onSyncProgress?: (newCount: number) => void;
  onSyncComplete?: () => void;
}

export function SyncProgress({ syncedCount, totalCount, onSyncProgress, onSyncComplete }: SyncProgressProps) {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [isRefreshingDates, setIsRefreshingDates] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [cachedCount, setCachedCount] = useState(syncedCount);
  const [apiRecordsProcessed, setApiRecordsProcessed] = useState(0);
  const [totalRecords, setTotalRecords] = useState(totalCount);
  const [error, setError] = useState<string | null>(null);
  const [batchesCompleted, setBatchesCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const syncingRef = useRef(false);
  const refreshingRef = useRef(false);
  
  const progress = totalRecords > 0 ? (apiRecordsProcessed / totalRecords) * 100 : 0;
  const isComplete = apiRecordsProcessed >= totalRecords && totalRecords > 0;
  
  // Load sync state on mount
  useEffect(() => {
    loadSyncState();
  }, []);
  
  // Update when props change
  useEffect(() => {
    setCachedCount(syncedCount);
    if (totalCount > 0) setTotalRecords(totalCount);
  }, [syncedCount, totalCount]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      syncingRef.current = false;
      refreshingRef.current = false;
    };
  }, []);
  
  const loadSyncState = async () => {
    try {
      const data = await apiClient.syncPatientFamilies('get-state');
      
      if (data?.success) {
        const syncState = data.syncState;
        const total = data.totalContacts || totalCount;
        
        setTotalRecords(total);
        setApiRecordsProcessed(syncState?.last_synced_contact_count || 0);
        
        console.log(`Loaded sync state: ${syncState?.last_synced_contact_count || 0} of ${total} processed`);
      }
    } catch (err) {
      console.error('Failed to load sync state:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const runSyncBatch = async (): Promise<boolean> => {
    try {
      console.log(`Running sync batch...`);
      
      // Don't pass skip - let the server use its stored state
      const data = await apiClient.syncPatientFamilies('sync');
      
      if (data?.success) {
        console.log('Sync response:', data);
        
        const newCachedCount = data.cachedCount || cachedCount;
        setCachedCount(newCachedCount);
        onSyncProgress?.(newCachedCount);
        
        if (data.nextSkip !== undefined) {
          setApiRecordsProcessed(data.nextSkip);
        }
        
        if (data.totalContacts) {
          setTotalRecords(data.totalContacts);
        }
        
        setBatchesCompleted(prev => prev + 1);
        
        if (data.complete) {
          setApiRecordsProcessed(data.totalContacts);
          onSyncComplete?.();
          return true;
        }
        return false;
      }
      return false;
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      return true;
    }
  };
  
  const startAutoSync = async () => {
    syncingRef.current = true;
    setIsAutoSyncing(true);
    setError(null);
    setBatchesCompleted(0);
    
    console.log(`Starting auto-sync from ${apiRecordsProcessed}`);
    
    const syncLoop = async () => {
      if (!syncingRef.current) return;
      
      const shouldStop = await runSyncBatch();
      
      if (!shouldStop && syncingRef.current) {
        setTimeout(syncLoop, 2000);
      } else {
        syncingRef.current = false;
        setIsAutoSyncing(false);
      }
    };
    
    syncLoop();
  };
  
  const stopAutoSync = () => {
    syncingRef.current = false;
    setIsAutoSyncing(false);
  };
  
  const resetSync = async () => {
    if (isAutoSyncing) {
      stopAutoSync();
    }
    
    try {
      const data = await apiClient.syncPatientFamilies('sync', { reset: true });
      
      setApiRecordsProcessed(data?.nextSkip || 50);
      setBatchesCompleted(1);
      console.log('Sync reset to beginning');
    } catch (err) {
      console.error('Reset failed:', err);
      setError('Failed to reset sync');
    }
  };
  
  // Refresh dates only - updates engagement dates without full resync
  const startRefreshDates = async () => {
    refreshingRef.current = true;
    setIsRefreshingDates(true);
    setRefreshProgress(0);
    setError(null);
    
    console.log('Starting date refresh...');
    
    const refreshLoop = async (offset = 0) => {
      if (!refreshingRef.current) return;
      
      try {
        const data = await apiClient.syncPatientFamilies('refresh-dates', { offset, batchSize: 50 });
        
        if (data?.success) {
          const progress = data.totalCached > 0 ? (data.nextOffset / data.totalCached) * 100 : 0;
          setRefreshProgress(progress);
          
          if (data.complete) {
            setRefreshProgress(100);
            refreshingRef.current = false;
            setIsRefreshingDates(false);
            onSyncComplete?.();
            console.log('Date refresh complete');
          } else if (refreshingRef.current) {
            setTimeout(() => refreshLoop(data.nextOffset), 2000);
          }
        }
      } catch (err) {
        console.error('Date refresh error:', err);
        setError(err instanceof Error ? err.message : 'Date refresh failed');
        refreshingRef.current = false;
        setIsRefreshingDates(false);
      }
    };
    
    refreshLoop();
  };
  
  const stopRefreshDates = () => {
    refreshingRef.current = false;
    setIsRefreshingDates(false);
  };
  
  const remainingRecords = totalRecords - apiRecordsProcessed;
  const batchSize = 50;
  const batchesRemaining = Math.ceil(remainingRecords / batchSize);
  const secondsPerBatch = 25;
  const estimatedMinutes = Math.ceil((batchesRemaining * secondsPerBatch) / 60);
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const estimatedMins = estimatedMinutes % 60;
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading sync state...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-primary" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          <span className="font-medium text-foreground">
            {isComplete ? 'Data Sync Complete' : 'Data Sync In Progress'}
          </span>
        </div>
        
        <div className="flex gap-2">
          {!isComplete && !isRefreshingDates && (
            <>
              {isAutoSyncing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopAutoSync}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={startAutoSync}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {apiRecordsProcessed > 0 ? 'Continue Sync' : 'Start Sync'}
                </Button>
              )}
            </>
          )}
          {!isAutoSyncing && (
            <>
              {isRefreshingDates ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopRefreshDates}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={startRefreshDates}
                  title="Refresh engagement dates only"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Refresh Dates
                </Button>
              )}
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={resetSync}
            disabled={isAutoSyncing || isRefreshingDates}
            title="Reset and start from beginning"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Progress value={progress} className="h-2 mb-2" />
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {apiRecordsProcessed.toLocaleString()} of {totalRecords.toLocaleString()} records processed
          {cachedCount > 0 && ` • ${cachedCount.toLocaleString()} cached`}
        </span>
        <span>{progress.toFixed(1)}%</span>
      </div>
      
      {!isComplete && !isRefreshingDates && (
        <div className="mt-2 text-xs text-muted-foreground">
          {isAutoSyncing ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing newest contacts first... {batchesCompleted} batches
              {estimatedHours > 0 && ` • ~${estimatedHours}h ${estimatedMins}m remaining`}
              {estimatedHours === 0 && estimatedMinutes > 0 && ` • ~${estimatedMinutes}m remaining`}
            </span>
          ) : (
            <span>
              {apiRecordsProcessed > 0 
                ? `Paused at ${apiRecordsProcessed.toLocaleString()} records. Click "Continue Sync" to resume.`
                : 'Click "Start Sync" to begin syncing (newest contacts first)'}
              {estimatedHours > 0 && ` (~${estimatedHours}h ${estimatedMins}m remaining)`}
            </span>
          )}
        </div>
      )}
      
      {isRefreshingDates && (
        <div className="mt-3">
          <Progress value={refreshProgress} className="h-2 mb-2" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Refreshing engagement dates... {refreshProgress.toFixed(0)}%</span>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
