import { Trash, PencilSimple, Image as ImageIcon, TShirt } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ImprintMockup {
  id: number;
  url: string;
  thumbnail_url?: string;
  name?: string;
}

interface ImprintCardProps {
  imprint: {
    id: number;
    decorationType?: string;
    location?: string;
    description?: string;
    colors?: string;
    colorCount?: number;
    width?: string | number;
    height?: string | number;
    mockups?: ImprintMockup[];
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
}

export function ImprintCard({ imprint, onEdit, onDelete, onImageClick }: ImprintCardProps) {
  const hasMockups = imprint.mockups && imprint.mockups.length > 0;
  const firstMockup = hasMockups ? imprint.mockups![0] : null;

  const handleImageClick = () => {
    if (hasMockups && onImageClick) {
      const allMockups = imprint.mockups!.map(m => ({
        url: m.thumbnail_url || m.url,
        name: m.name || 'Imprint mockup',
        id: String(m.id)
      }));
      onImageClick(allMockups, 0);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-2.5 py-1.5 hover:border-primary/30 transition-colors group">
      {/* Thumbnail */}
      <div
        onClick={hasMockups ? handleImageClick : undefined}
        className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${
          hasMockups ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : 'bg-muted'
        }`}
      >
        {firstMockup ? (
          <img
            src={firstMockup.thumbnail_url || firstMockup.url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted');
            }}
          />
        ) : (
          <TShirt className="w-4 h-4 text-muted-foreground" weight="duotone" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-[180px]">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20 flex-shrink-0"
          >
            {imprint.decorationType || 'Imprint'}
          </Badge>
          {imprint.location && (
            <span className="text-xs font-medium text-foreground truncate">
              {imprint.location}
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
          {imprint.description || imprint.colors || (
            imprint.width && imprint.height
              ? `${imprint.width}" × ${imprint.height}"`
              : 'No details'
          )}
        </div>
      </div>

      {/* Actions - show on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="Edit imprint"
          >
            <PencilSimple size={12} weight="bold" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Delete imprint"
          >
            <Trash size={12} weight="bold" />
          </Button>
        )}
      </div>

      {/* Mockup count indicator */}
      {hasMockups && imprint.mockups!.length > 1 && (
        <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded">
          +{imprint.mockups!.length - 1}
        </span>
      )}
    </div>
  );
}
