import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ColumnConfig {
  category: boolean;
  itemNumber: boolean;
  color: boolean;
  sizes: {
    baby: {
      '6M': boolean;
      '12M': boolean;
      '18M': boolean;
      '24M': boolean;
      '2T': boolean;
      '3T': boolean;
      '4T': boolean;
      '5T': boolean;
    };
    youth: {
      'Youth-XS': boolean;
      'Youth-S': boolean;
      'Youth-M': boolean;
      'Youth-L': boolean;
      'Youth-XL': boolean;
    };
    adult: {
      XS: boolean;
      S: boolean;
      M: boolean;
      L: boolean;
      XL: boolean;
      '2XL': boolean;
      '3XL': boolean;
      '4XL': boolean;
      '5XL': boolean;
      '6XL': boolean;
    };
  };
  quantity: boolean;
}

export const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  category: false,
  itemNumber: false,
  color: false,
  sizes: {
    baby: {
      '6M': false,
      '12M': false,
      '18M': false,
      '24M': false,
      '2T': false,
      '3T': false,
      '4T': false,
      '5T': false,
    },
    youth: {
      'Youth-XS': false,
      'Youth-S': false,
      'Youth-M': false,
      'Youth-L': false,
      'Youth-XL': false,
    },
    adult: {
      XS: true,
      S: true,
      M: true,
      L: true,
      XL: true,
      '2XL': true,
      '3XL': true,
      '4XL': false,
      '5XL': false,
      '6XL': false,
    },
  },
  quantity: false,
};

interface ManageColumnsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ColumnConfig;
  onChange: (config: ColumnConfig) => void;
}

export function ManageColumnsModal({ open, onOpenChange, config, onChange }: ManageColumnsModalProps) {
  const updateConfig = (path: string[], value: boolean) => {
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="category"
                  checked={config.category}
                  onCheckedChange={(checked) => updateConfig(['category'], checked as boolean)}
                />
                <Label htmlFor="category" className="cursor-pointer">Category</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="itemNumber"
                  checked={config.itemNumber}
                  onCheckedChange={(checked) => updateConfig(['itemNumber'], checked as boolean)}
                />
                <Label htmlFor="itemNumber" className="cursor-pointer">Item #</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="color"
                  checked={config.color}
                  onCheckedChange={(checked) => updateConfig(['color'], checked as boolean)}
                />
                <Label htmlFor="color" className="cursor-pointer">Color</Label>
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Baby/Toddler</p>
              {Object.keys(config.sizes.baby).map((size) => (
                <div key={size} className="flex items-center space-x-2 ml-4">
                  <Checkbox
                    id={`baby-${size}`}
                    checked={config.sizes.baby[size as keyof typeof config.sizes.baby]}
                    onCheckedChange={(checked) => updateConfig(['sizes', 'baby', size], checked as boolean)}
                  />
                  <Label htmlFor={`baby-${size}`} className="cursor-pointer">{size}</Label>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Youth</p>
              {Object.keys(config.sizes.youth).map((size) => (
                <div key={size} className="flex items-center space-x-2 ml-4">
                  <Checkbox
                    id={`youth-${size}`}
                    checked={config.sizes.youth[size as keyof typeof config.sizes.youth]}
                    onCheckedChange={(checked) => updateConfig(['sizes', 'youth', size], checked as boolean)}
                  />
                  <Label htmlFor={`youth-${size}`} className="cursor-pointer">{size}</Label>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Adult</p>
              {Object.keys(config.sizes.adult).map((size) => (
                <div key={size} className="flex items-center space-x-2 ml-4">
                  <Checkbox
                    id={`adult-${size}`}
                    checked={config.sizes.adult[size as keyof typeof config.sizes.adult]}
                    onCheckedChange={(checked) => updateConfig(['sizes', 'adult', size], checked as boolean)}
                  />
                  <Label htmlFor={`adult-${size}`} className="cursor-pointer">{size}</Label>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Other</p>
              <div className="flex items-center space-x-2 ml-4">
                <Checkbox
                  id="quantity"
                  checked={config.quantity}
                  onCheckedChange={(checked) => updateConfig(['quantity'], checked as boolean)}
                />
                <Label htmlFor="quantity" className="cursor-pointer">Quantity</Label>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
