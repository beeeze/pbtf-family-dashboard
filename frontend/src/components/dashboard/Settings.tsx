import { useState } from 'react';
import { Trash2, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/apiClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Settings() {
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [clearError, setError] = useState<string | null>(null);
  const [lastClearTime, setLastClearTime] = useState<string | null>(
    localStorage.getItem('lastCacheCleared')
  );

  const handleClearCache = async () => {
    setIsClearing(true);
    setClearSuccess(false);
    setError(null);

    try {
      // Call backend to clear MongoDB cache
      await apiClient.post('/api/clear-cache');

      // Clear local storage
      const keysToKeep = ['customWidgets']; // Keep user's custom widgets
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Set last clear time
      const clearTime = new Date().toISOString();
      localStorage.setItem('lastCacheCleared', clearTime);
      setLastClearTime(clearTime);

      setClearSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setClearSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to clear cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application settings and data
        </p>
      </div>

      {/* Cache Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear cached data to refresh information from the source
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clearSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Cache Cleared Successfully</AlertTitle>
              <AlertDescription className="text-green-700">
                All cached data has been cleared. The application will fetch fresh data on the next request.
              </AlertDescription>
            </Alert>
          )}

          {clearError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{clearError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Last Cache Cleared</p>
                <p className="text-xs text-muted-foreground">{formatDate(lastClearTime)}</p>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isClearing}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isClearing ? 'Clearing Cache...' : 'Clear Cache'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all cached patient family data and sync states. 
                  The application will need to re-fetch data from Virtuous CRM on the next sync.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCache}>
                  Clear Cache
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="font-medium text-foreground">What gets cleared:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Cached patient family data</li>
              <li>Sync state and progress</li>
              <li>Engagement statistics</li>
              <li>Geographic mapping data</li>
            </ul>
            <p className="font-medium text-foreground mt-4">What is preserved:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your custom widgets</li>
              <li>User preferences</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Sections */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Application Name:</span>
              <span className="font-medium">PBTF Family Reporting Platform</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database:</span>
              <span className="font-medium">MongoDB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <span className="font-medium">Virtuous CRM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
