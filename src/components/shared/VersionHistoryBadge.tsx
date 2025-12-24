import { Clock, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatVersionTimestamp } from '@/lib/version-control';
import type { VersionEntry } from '@/lib/version-control';

interface VersionHistoryBadgeProps {
  versions: VersionEntry<any>[];
  currentVersion: number;
  onRevert?: (version: number) => void;
  entityName?: string;
}

export function VersionHistoryBadge({ 
  versions, 
  currentVersion, 
  onRevert,
  entityName = 'Item'
}: VersionHistoryBadgeProps) {
  if (versions.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Clock size={14} />
          <span className="text-xs">v{currentVersion}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {versions.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-1">Version History</h4>
            <p className="text-xs text-muted-foreground">
              {entityName} - {versions.length} version{versions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Separator />
          
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-2">
              {[...versions].reverse().map((version) => (
                <div
                  key={version.version}
                  className="border border-border rounded-md p-2 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge 
                          variant={version.version === currentVersion ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          v{version.version}
                        </Badge>
                        {version.version === currentVersion && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                      
                      <p className="text-xs font-medium mb-0.5 truncate">
                        {version.change_description}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatVersionTimestamp(version.timestamp)}
                      </p>
                      
                      {version.user_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {version.user_name}
                        </p>
                      )}
                      
                      {version.fields_changed && version.fields_changed.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {version.fields_changed.slice(0, 3).map((field, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {version.fields_changed.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{version.fields_changed.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {version.version !== currentVersion && onRevert && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRevert(version.version)}
                        className="h-7 w-7 p-0 shrink-0"
                        title="Revert to this version"
                      >
                        <ArrowCounterClockwise size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
