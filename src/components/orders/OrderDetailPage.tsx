import React, { useState, useEffect, useRef } from 'react';
import { useOrderDetail, useQuoteDetail, type OrderDetail, type OrderDetailLineItem, type LineItemImprint, type QuoteAsOrder } from '@/lib/hooks';
import { convertToOrder } from '@/lib/quote-api';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Image,
  Warning,
  ArrowClockwise,
  Package,
  Printer,
  FilePdf,
  FileImage,
  File,
  DotsThree,
  Copy,
  Trash,
  Columns,
  Stamp,
  PencilSimple,
  Check,
  X,
  Upload,
  Plus,
  CircleNotch,
  ChatText
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';
import { SizeBreakdown } from '@/lib/types';
import { ImageModal } from '@/components/shared/ImageModal';
import { ManageColumnsModal, ColumnConfig, DEFAULT_COLUMN_CONFIG } from './ManageColumnsModal';
import { CustomerSelector } from './CustomerSelector';
// ImprintCard is defined locally in this file (line ~2249)
import { MoreActionsMenu } from './MoreActionsMenu';
import { toast } from 'sonner';

const API_BASE = 'https://mintprints-api.ronny.works';

// Component for rendering PDF thumbnail with fallback
function PdfThumbnail({ 
  thumbnailUrl, 
  pdfUrl, 
  name, 
  size = 'large',
  className = '' 
}: { 
  thumbnailUrl: string | null | undefined; 
  pdfUrl: string; 
  name: string; 
  size?: 'small' | 'large';
  className?: string;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Reset state when thumbnailUrl changes
  useEffect(() => {
    setThumbnailFailed(false);
    setImgLoaded(false);
  }, [thumbnailUrl]);
  
  const iconSize = size === 'small' ? 20 : 28;
  const dimensions = size === 'small' 
    ? 'w-16 h-16'
    : 'w-24 h-24';
  
  const hasThumbnail = thumbnailUrl && thumbnailUrl.trim() !== '' && !thumbnailFailed;
  
  // If we have a valid thumbnail URL, try to show the image
  if (hasThumbnail) {
    return (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${dimensions} flex-shrink-0 rounded-lg border-2 border-border hover:border-primary transition-all hover:shadow-lg overflow-hidden relative bg-card group ${className}`}
        title={`Open ${name} (PDF)`}
      >
        <img
          src={thumbnailUrl}
          alt={name}
          className={`w-full h-full object-cover transition-all duration-200 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setThumbnailFailed(true);
            setImgLoaded(false);
          }}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <FilePdf size={iconSize} className="text-red-400/50 animate-pulse" weight="fill" />
          </div>
        )}
        {/* PDF indicator badge - only show when image is loaded */}
        {imgLoaded && (
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold uppercase shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            PDF
          </div>
        )}
      </a>
    );
  }
  
  // Fallback to styled "View PDF" button with icon
  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${dimensions} flex-shrink-0 rounded-lg border-2 border-border hover:border-primary transition-all hover:shadow-lg overflow-hidden relative bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 group ${className}`}
      title={`Open ${name} (PDF)`}
    >
      <div className="w-full h-full flex flex-col items-center justify-center group-hover:from-red-100 group-hover:to-red-200 dark:group-hover:from-red-900/30 dark:group-hover:to-red-800/30 transition-all">
        <FilePdf size={iconSize} className="text-red-500 mb-1 group-hover:scale-110 transition-transform" weight="fill" />
        <span className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold tracking-wide">View PDF</span>
      </div>
    </a>
  );
}

// Helper to check if URL is a PDF
function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

// Helper to get file extension
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

// Helper to check if file is an image
function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

// Helper to get file icon
function getFileIcon(filename: string) {
  const ext = getFileExtension(filename);
  
  if (ext === 'pdf') {
    return <FilePdf className="w-5 h-5 text-red-400" weight="fill" />;
  }
  
  if (isImageFile(filename)) {
    return <FileImage className="w-5 h-5 text-blue-400" weight="fill" />;
  }
  
  return <File className="w-5 h-5 text-muted-foreground" weight="bold" />;
}

// Map API size keys to SizeBreakdown format
function mapSizesToGrid(sizes: OrderDetailLineItem['sizes']): Record<string, number> {
  return {
    XS: sizes.xs || 0,
    S: sizes.s || 0,
    M: sizes.m || 0,
    L: sizes.l || 0,
    XL: sizes.xl || 0,
    '2XL': sizes.xxl || 0,
    '3XL': sizes.xxxl || 0,
    '4XL': sizes.xxxxl || 0,
    '5XL': sizes.xxxxxl || 0,
    '6XL': 0,
  };
}

// Mockup upload dialog component
interface MockupUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
  title: string;
}

function MockupUploadDialog({ open, onOpenChange, onUpload, title }: MockupUploadDialogProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is too large (max 10MB)`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name} is not a supported file type`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      newFiles.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join(', '));
        toast.error(errors[0]);
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      newFiles.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join(', '));
        toast.error(errors[0]);
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleUpload = () => {
    if (uploadedFiles.length === 0) return;
    onUpload(uploadedFiles);
    setUploadedFiles([]);
    setError(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setUploadedFiles([]);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => document.getElementById('mockup-file-input')?.click()}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" weight="bold" />
            <p className="text-sm font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports: JPG, PNG, GIF, WEBP, PDF (max 10MB per file)</p>
            <input
              id="mockup-file-input"
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files ({uploadedFiles.length})</p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    {file.type.startsWith('image/') ? (
                      <FileImage className="w-4 h-4 text-blue-400 flex-shrink-0" weight="fill" />
                    ) : file.type === 'application/pdf' ? (
                      <FilePdf className="w-4 h-4 text-red-400 flex-shrink-0" weight="fill" />
                    ) : (
                      <File className="w-4 h-4 text-muted-foreground flex-shrink-0" weight="bold" />
                    )}
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                    >
                      <X size={14} weight="bold" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploadedFiles.length === 0}>
            Upload {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline artwork upload component for line items and imprints
interface ArtworkUploadProps {
  orderId: number;
  lineItemId?: number;
  currentMockup?: { id: string; url: string; thumbnail_url?: string | null; name?: string } | null;
  onUploadComplete: () => void;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
  size?: 'sm' | 'md';
}

function ArtworkUpload({ orderId, lineItemId, currentMockup, onUploadComplete, onImageClick, size = 'md' }: ArtworkUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (lineItemId) {
        formData.append('line_item_id', lineItemId.toString());
      }

      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/artwork`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      toast.success('Artwork uploaded');
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMockup || !confirm('Delete this artwork?')) return;

    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/artwork/${currentMockup.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Artwork deleted');
      onUploadComplete();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  // If has mockup, show it with delete option
  if (currentMockup) {
    return (
      <div className="relative group">
        <button
          onClick={() => {
            onImageClick?.([{
              url: currentMockup.url,
              name: currentMockup.name || 'Artwork',
              id: currentMockup.id
            }], 0);
          }}
          className={`${sizeClass} flex-shrink-0 rounded border border-border bg-card hover:border-primary hover:shadow-sm transition-all cursor-pointer overflow-hidden`}
          title={currentMockup.name || 'Click to view'}
        >
          <img
            src={currentMockup.thumbnail_url || currentMockup.url}
            alt={currentMockup.name || 'Artwork'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </button>
        <button
          onClick={handleDelete}
          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          title="Delete artwork"
        >
          <X size={10} weight="bold" />
        </button>
      </div>
    );
  }

  // No mockup - show upload zone
  return (
    <div
      className={`${sizeClass} border border-dashed rounded flex items-center justify-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      title="Click or drag to upload"
    >
      {isUploading ? (
        <CircleNotch size={14} className="animate-spin text-muted-foreground" />
      ) : (
        <Upload size={14} className="text-muted-foreground/50" weight="bold" />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.eps,.ai"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

// Add Line Item dialog component
interface AddLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (lineItem: Partial<OrderDetailLineItem>) => void;
}

function AddLineItemDialog({ open, onOpenChange, onAdd }: AddLineItemDialogProps) {
  const [description, setDescription] = useState('');
  const [styleNumber, setStyleNumber] = useState('');
  const [color, setColor] = useState('');
  const [unitCost, setUnitCost] = useState('0');

  const handleAdd = () => {
    onAdd({
      description,
      styleNumber,
      color,
      unitCost: parseFloat(unitCost) || 0,
      totalQuantity: 0,
      totalCost: 0,
      sizes: {
        // Baby/Toddler
        '6m': 0, '12m': 0, '18m': 0, '24m': 0, '2t': 0, '3t': 0, '4t': 0, '5t': 0,
        // Youth
        yxs: 0, ys: 0, ym: 0, yl: 0, yxl: 0,
        // Adult
        xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0, xxxxxl: 0, xxxxxx: 0,
        // Other
        other: 0
      },
      imprints: []
    });
    setDescription('');
    setStyleNumber('');
    setColor('');
    setUnitCost('0');
    onOpenChange(false);
  };

  const handleClose = () => {
    setDescription('');
    setStyleNumber('');
    setColor('');
    setUnitCost('0');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description *</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Gildan 5000 T-Shirt"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Style Number</label>
              <Input
                value={styleNumber}
                onChange={(e) => setStyleNumber(e.target.value)}
                placeholder="e.g., G5000"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Color</label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., Black"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Unit Cost</label>
            <Input
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You can add sizes and imprints after creating the line item.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!description.trim()}>
            <Plus className="w-4 h-4 mr-1.5" weight="bold" />
            Add Line Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add Imprint dialog component
interface AddImprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (imprint: Partial<LineItemImprint>) => void;
  lineItemDescription?: string;
}

function AddImprintDialog({ open, onOpenChange, onAdd, lineItemDescription }: AddImprintDialogProps) {
  const [location, setLocation] = useState('');
  const [decorationType, setDecorationType] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState('');

  const handleAdd = () => {
    onAdd({
      location,
      decorationType,
      description,
      colors,
      colorCount: 0,
      width: null,
      height: null,
      mockups: []
    });
    setLocation('');
    setDecorationType('');
    setDescription('');
    setColors('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setLocation('');
    setDecorationType('');
    setDescription('');
    setColors('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Imprint {lineItemDescription && `to ${lineItemDescription}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location *</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Front, Back"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Input
                value={decorationType}
                onChange={(e) => setDecorationType(e.target.value)}
                placeholder="e.g., Screen Print"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the imprint details..."
              className="min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Colors</label>
            <Input
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="e.g., Black, White"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You can upload mockups and add more details after creating the imprint.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!location.trim()}>
            <Plus className="w-4 h-4 mr-1.5" weight="bold" />
            Add Imprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LineItemsTableProps {
  items: OrderDetailLineItem[];
  orderId: number;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
  onRefetch: () => void;
}

interface EditingCell {
  itemId: string;
  field: string;
  value: string | number;
}

interface EditingImprintCell {
  imprintId: number;
  field: string;
  value: string | number;
}

function LineItemsTable({ items, orderId, onImageClick, onRefetch }: LineItemsTableProps) {
  const [columnConfig, setColumnConfig] = useKV<ColumnConfig>('order-column-config', DEFAULT_COLUMN_CONFIG);
  const currentColumnConfig = columnConfig || DEFAULT_COLUMN_CONFIG;
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingImprintCell, setEditingImprintCell] = useState<EditingImprintCell | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<OrderDetailLineItem>>>({}); 
  const [editedImprints, setEditedImprints] = useState<Record<number, Partial<LineItemImprint>>>({}); 
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set(items.map(i => i.id)));

  // Auto-expand items when they load/change (to show imprints by default)
  useEffect(() => {
    if (items.length > 0) {
      setExpandedItems(new Set(items.map(i => i.id)));
    }
  }, [items]);

  // Debug logging moved after visibleSizeColumns declaration
  
  // All size columns organized by category with config mapping
  const ALL_SIZE_COLUMNS = [
    // Baby/Toddler
    { key: '6m', label: '6M', category: 'baby' as const, configKey: '6M' },
    { key: '12m', label: '12M', category: 'baby' as const, configKey: '12M' },
    { key: '18m', label: '18M', category: 'baby' as const, configKey: '18M' },
    { key: '24m', label: '24M', category: 'baby' as const, configKey: '24M' },
    { key: '2t', label: '2T', category: 'baby' as const, configKey: '2T' },
    { key: '3t', label: '3T', category: 'baby' as const, configKey: '3T' },
    { key: '4t', label: '4T', category: 'baby' as const, configKey: '4T' },
    { key: '5t', label: '5T', category: 'baby' as const, configKey: '5T' },
    // Youth
    { key: 'yxs', label: 'Y-XS', category: 'youth' as const, configKey: 'Youth-XS' },
    { key: 'ys', label: 'Y-S', category: 'youth' as const, configKey: 'Youth-S' },
    { key: 'ym', label: 'Y-M', category: 'youth' as const, configKey: 'Youth-M' },
    { key: 'yl', label: 'Y-L', category: 'youth' as const, configKey: 'Youth-L' },
    { key: 'yxl', label: 'Y-XL', category: 'youth' as const, configKey: 'Youth-XL' },
    // Adult
    { key: 'xs', label: 'XS', category: 'adult' as const, configKey: 'XS' },
    { key: 's', label: 'S', category: 'adult' as const, configKey: 'S' },
    { key: 'm', label: 'M', category: 'adult' as const, configKey: 'M' },
    { key: 'l', label: 'L', category: 'adult' as const, configKey: 'L' },
    { key: 'xl', label: 'XL', category: 'adult' as const, configKey: 'XL' },
    { key: 'xxl', label: '2XL', category: 'adult' as const, configKey: '2XL' },
    { key: 'xxxl', label: '3XL', category: 'adult' as const, configKey: '3XL' },
    { key: 'xxxxl', label: '4XL', category: 'adult' as const, configKey: '4XL' },
    { key: 'xxxxxl', label: '5XL', category: 'adult' as const, configKey: '5XL' },
    { key: 'xxxxxx', label: '6XL', category: 'adult' as const, configKey: '6XL' },
  ];

  // Map all sizes from item to display format
  const mapSizesToDisplay = (sizes: OrderDetailLineItem['sizes']): Record<string, number> => {
    return {
      // Baby/Toddler
      '6M': sizes['6m'] || 0,
      '12M': sizes['12m'] || 0,
      '18M': sizes['18m'] || 0,
      '24M': sizes['24m'] || 0,
      '2T': sizes['2t'] || 0,
      '3T': sizes['3t'] || 0,
      '4T': sizes['4t'] || 0,
      '5T': sizes['5t'] || 0,
      // Youth
      'Y-XS': sizes.yxs || 0,
      'Y-S': sizes.ys || 0,
      'Y-M': sizes.ym || 0,
      'Y-L': sizes.yl || 0,
      'Y-XL': sizes.yxl || 0,
      // Adult
      XS: sizes.xs || 0,
      S: sizes.s || 0,
      M: sizes.m || 0,
      L: sizes.l || 0,
      XL: sizes.xl || 0,
      '2XL': sizes.xxl || 0,
      '3XL': sizes.xxxl || 0,
      '4XL': sizes.xxxxl || 0,
      '5XL': sizes.xxxxxl || 0,
      '6XL': sizes.xxxxxx || 0,
    };
  };

  // Get visible columns based on config + auto-show columns with data
  const getVisibleSizeColumns = () => {
    // Check if any line item has any size value > 0
    const hasSizeBreakdown = items.some(item => {
      const sizes = mapSizesToDisplay(item.sizes);
      return Object.values(sizes).some(qty => qty > 0);
    });

    // Only hide ALL size columns if no items have size data AND no sizes enabled in config
    const hasEnabledSizes = Object.values(currentColumnConfig.sizes.adult).some(v => v) ||
                            Object.values(currentColumnConfig.sizes.youth).some(v => v) ||
                            Object.values(currentColumnConfig.sizes.baby).some(v => v);

    if (!hasSizeBreakdown && !hasEnabledSizes) return [];

    // Check which columns have data in any line item
    const columnsWithData = new Set<string>();
    items.forEach(item => {
      const sizes = mapSizesToDisplay(item.sizes);
      ALL_SIZE_COLUMNS.forEach(col => {
        if (sizes[col.label] > 0) {
          columnsWithData.add(col.key);
        }
      });
    });

    // Filter columns: show if enabled in config OR has data
    return ALL_SIZE_COLUMNS.filter(col => {
      const categoryConfig = currentColumnConfig.sizes[col.category];
      const isEnabledInConfig = categoryConfig?.[col.configKey as keyof typeof categoryConfig];
      const hasData = columnsWithData.has(col.key);
      return isEnabledInConfig || hasData;
    });
  };

  const visibleSizeColumns = getVisibleSizeColumns();

  const toggleExpanded = (itemId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const getItemValue = (item: OrderDetailLineItem, field: string): string | number => {
    const edited = editedItems[item.id];
    if (edited && field in edited) {
      const val = edited[field as keyof typeof edited];
      return val !== undefined && val !== null ? val as (string | number) : '';
    }
    
    if (field === 'styleNumber') return item.styleNumber || '';
    if (field === 'color') return item.color || '';
    if (field === 'description') return item.description || '';
    if (field === 'unitCost') return item.unitCost;
    if (field.startsWith('size-')) {
      const size = field.replace('size-', '');
      const sizes = mapSizesToDisplay(item.sizes);
      return sizes[size as keyof typeof sizes] || 0;
    }
    return '';
  };

  const handleCellClick = (itemId: string, field: string, value: string | number) => {
    setEditingCell({ itemId, field, value });
  };

  const handleCellChange = (value: string) => {
    if (!editingCell) return;
    
    setEditedItems((prev) => ({
      ...prev,
      [editingCell.itemId]: {
        ...prev[editingCell.itemId],
        [editingCell.field]: editingCell.field === 'unitCost' || editingCell.field.startsWith('size-')
          ? parseFloat(value) || 0
          : value,
      },
    }));
    
    setEditingCell({ ...editingCell, value });
  };

  const handleCellBlur = async () => {
    if (editingCell) {
      const itemId = parseInt(editingCell.itemId);
      const edited = editedItems[editingCell.itemId] || {};

      try {
        const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/line-items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(edited),
        });
        if (!response.ok) throw new Error('Failed to update line item');

        toast.success('Cell updated');
        onRefetch();
      } catch (err) {
        toast.error('Failed to update line item');
        console.error('Cell update error:', err);
      }
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const getImprintValue = (imprint: LineItemImprint, field: string): string | number => {
    const edited = editedImprints[imprint.id];
    if (edited && field in edited) {
      const val = edited[field as keyof typeof edited];
      return val !== undefined && val !== null ? val as (string | number) : '';
    }
    
    if (field === 'location') return imprint.location || '';
    if (field === 'decorationType') return imprint.decorationType || '';
    if (field === 'description') return imprint.description || '';
    if (field === 'colorCount') return imprint.colorCount || 0;
    if (field === 'colors') return imprint.colors || '';
    if (field === 'width') return imprint.width || '';
    if (field === 'height') return imprint.height || '';
    return '';
  };

  const handleImprintCellClick = (imprintId: number, field: string, value: string | number) => {
    setEditingImprintCell({ imprintId, field, value });
  };

  const handleImprintCellChange = (value: string) => {
    if (!editingImprintCell) return;
    
    setEditedImprints((prev) => ({
      ...prev,
      [editingImprintCell.imprintId]: {
        ...prev[editingImprintCell.imprintId],
        [editingImprintCell.field]: ['colorCount', 'width', 'height'].includes(editingImprintCell.field)
          ? parseFloat(value) || 0
          : value,
      },
    }));
    
    setEditingImprintCell({ ...editingImprintCell, value });
  };

  const handleImprintCellBlur = async () => {
    if (editingImprintCell) {
      const imprintId = editingImprintCell.imprintId;
      const field = editingImprintCell.field;
      const value = editingImprintCell.value;

      // Map frontend field names to API field names
      const fieldMap: Record<string, string> = {
        location: 'location',
        decorationType: 'decoration_type',
        description: 'description',
        colorCount: 'color_count',
        colors: 'colors',
        width: 'width',
        height: 'height',
      };

      const apiField = fieldMap[field] || field;

      try {
        const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/imprints/${imprintId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [apiField]: value }),
        });

        if (!response.ok) throw new Error('Failed to update imprint');

        toast.success('Imprint updated');
        onRefetch();
      } catch (error) {
        console.error('Failed to update imprint:', error);
        toast.error('Failed to update imprint');
      }

      setEditingImprintCell(null);
    }
  };

  const handleDeleteImprint = async (imprintId: number) => {
    if (!confirm('Delete this imprint?')) return;

    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/imprints/${imprintId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete imprint');

      toast.success('Imprint deleted');
      onRefetch();
    } catch (error) {
      console.error('Failed to delete imprint:', error);
      toast.error('Failed to delete imprint');
    }
  };

  const handleAddImprintForItem = async (lineItemId: number) => {
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/imprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_item_id: lineItemId,
          location: 'New Location',
          decoration_type: 'Screen Printing',
          description: '',
          color_count: 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to add imprint');

      toast.success('Imprint added');
      onRefetch();
    } catch (error) {
      console.error('Failed to add imprint:', error);
      toast.error('Failed to add imprint');
    }
  };

  const handleImprintKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleImprintCellBlur();
    } else if (e.key === 'Escape') {
      setEditingImprintCell(null);
    }
  };

  const renderEditableCell = (item: OrderDetailLineItem, field: string, align: 'left' | 'center' | 'right' = 'left') => {
    const value = getItemValue(item, field);
    const isEditing = editingCell?.itemId === String(item.id) && editingCell?.field === field;
    const isEmpty = value === '' || value === null || (typeof value === 'number' && value === 0);
    const displayValue = field === 'unitCost' ? formatCurrency(Number(value)) : (isEmpty ? '-' : String(value));
    
    const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    const paddingClass = field.startsWith('size-') ? 'px-2' : 'px-3';
    
    return (
      <td 
        className={`${paddingClass} py-1.5 align-top cursor-pointer hover:bg-primary/5 transition-colors group relative ${alignmentClass}`}
        onClick={() => !isEditing && handleCellClick(String(item.id), field, value)}
      >
        {isEditing ? (
          <Input
            autoFocus
            type={field === 'unitCost' || field.startsWith('size-') ? 'number' : 'text'}
            value={String(editingCell.value)}
            onChange={(e) => handleCellChange(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className={`h-7 text-xs ${alignmentClass} py-0 px-2 border-primary focus-visible:ring-1`}
            step={field === 'unitCost' ? '0.01' : '1'}
            min={field.startsWith('size-') ? '0' : undefined}
          />
        ) : (
          <div className="flex items-center gap-1 h-7 py-1">
            <span className={`flex-1 ${field.startsWith('size-') && typeof value === 'number' && value === 0 ? 'text-muted-foreground/30' : 'text-foreground'} ${field.startsWith('size-') && typeof value === 'number' && value > 0 ? 'font-medium' : ''}`}>
              {displayValue}
            </span>
            <PencilSimple 
              className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
              weight="bold" 
            />
          </div>
        )}
      </td>
    );
  };

  const renderEditableImprintCell = (imprint: LineItemImprint, field: string, align: 'left' | 'center' | 'right' = 'left', colSpan: number = 1) => {
    const value = getImprintValue(imprint, field);
    const isEditing = editingImprintCell?.imprintId === imprint.id && editingImprintCell?.field === field;
    const isEmpty = value === '' || value === null || (typeof value === 'number' && value === 0);
    const displayValue = isEmpty ? '-' : String(value);
    
    const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    
    return (
      <td 
        colSpan={colSpan}
        className={`px-3 py-1.5 align-top cursor-pointer hover:bg-primary/5 transition-colors group relative ${alignmentClass}`}
        onClick={() => !isEditing && handleImprintCellClick(imprint.id, field, value)}
      >
        {isEditing ? (
          <Input
            autoFocus
            type={['colorCount', 'width', 'height'].includes(field) ? 'number' : 'text'}
            value={String(editingImprintCell.value)}
            onChange={(e) => handleImprintCellChange(e.target.value)}
            onBlur={handleImprintCellBlur}
            onKeyDown={handleImprintKeyDown}
            className={`h-7 text-xs ${alignmentClass} py-0 px-2 border-primary focus-visible:ring-1`}
            step={['width', 'height'].includes(field) ? '0.01' : '1'}
            min="0"
          />
        ) : (
          <div className="flex items-center gap-1 h-7 py-1">
            <span className={`flex-1 ${isEmpty ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
              {displayValue}
            </span>
            <PencilSimple 
              className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
              weight="bold" 
            />
          </div>
        )}
      </td>
    );
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap w-8">
              </th>
              {currentColumnConfig.itemNumber && (
                <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  Item #
                </th>
              )}
              {currentColumnConfig.color && (
                <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  Color
                </th>
              )}
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[200px]">
                Description
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                Mockup
              </th>
              {visibleSizeColumns.map(col => (
                <th key={col.key} className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {currentColumnConfig.quantity && (
                <th className="text-center px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  Quantity
                </th>
              )}
              <th className="text-center px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                Items
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                Price
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                Taxed
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const sizes = mapSizesToDisplay(item.sizes);
              const editedSizes = editedItems[String(item.id)] || {};
              const currentSizes = { ...sizes, ...editedSizes };
              
              // Calculate total qty from visible size columns (for editing scenarios)
              const sizeColumnsQty = visibleSizeColumns.reduce((sum, col) => {
                const sizeKey = `size-${col.label}`;
                const qty = sizeKey in editedSizes ? Number(editedSizes[sizeKey as keyof typeof editedSizes] || 0) : sizes[col.label];
                return sum + qty;
              }, 0);

              // Use item.totalQuantity as authoritative source, fallback to size columns sum
              const totalQty = item.totalQuantity || sizeColumnsQty;

              const unitCost = getItemValue(item, 'unitCost');
              // Use item.totalCost if available, otherwise calculate from qty × price
              const totalCost = item.totalCost > 0
                ? item.totalCost
                : totalQty * Number(unitCost);
              const isExpanded = expandedItems.has(item.id);
              const hasImprints = item.imprints && item.imprints.length > 0;
              
              // Check if this is the first item in a group
              const isFirstInGroup = idx === 0 || items[idx - 1].groupId !== item.groupId;
              const isInGroup = item.groupId !== null;
              
              return (
                <>
                  {/* Group Header Row */}
                  {isFirstInGroup && isInGroup && (
                    <tr className="bg-muted/30 border-b border-border">
                      <td colSpan={100} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary rounded-full"></div>
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                            {item.groupName || `Group ${item.groupId}`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Line Item Row */}
                  <tr key={item.id} className={`border-b border-border hover:bg-muted/10 transition-colors ${isInGroup ? 'bg-muted/5' : ''}`}>
                    <td className="px-3 py-1.5 align-top">
                      <div className="h-7 flex items-center">
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="p-0.5 hover:bg-muted rounded transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform ${hasImprints ? 'text-muted-foreground' : 'text-muted-foreground/30'} ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    {currentColumnConfig.itemNumber && renderEditableCell(item, 'styleNumber', 'left')}
                    {currentColumnConfig.color && renderEditableCell(item, 'color', 'left')}
                    {renderEditableCell(item, 'description', 'left')}
                    <td className="px-3 py-1.5 align-top text-center">
                      <div className="h-10 flex items-center justify-center">
                        <ArtworkUpload
                          orderId={orderId}
                          lineItemId={item.id}
                          currentMockup={item.mockup}
                          onUploadComplete={onRefetch}
                          onImageClick={onImageClick}
                        />
                      </div>
                    </td>
                    {visibleSizeColumns.map(col => renderEditableCell(item, `size-${col.label}`, 'center'))}
                    {currentColumnConfig.quantity && (
                      <td className="px-3 py-1.5 text-center align-top">
                        <div className="h-7 flex items-center justify-center">
                          <span className="text-foreground font-medium">
                            {totalQty}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-center align-top">
                      <div className="h-7 flex items-center justify-center">
                        <span className="text-foreground font-medium">
                          {item.totalQuantity}
                        </span>
                      </div>
                    </td>
                    {renderEditableCell(item, 'unitCost', 'right')}
                    <td className="px-3 py-1.5 text-center align-top">
                      <div className="h-7 flex items-center justify-center">
                        <Check className="w-4 h-4 text-foreground" weight="bold" />
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right align-top">
                      <div className="h-7 flex items-center justify-end">
                        <span className="text-foreground font-medium">
                          {formatCurrency(totalCost)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Imprint Cards Row */}
                  {isExpanded && (
                    <tr className="bg-muted/20 border-b border-border/50">
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-start justify-center pt-0.5">
                          <div className="w-1 h-4 bg-primary/30 rounded-full"></div>
                        </div>
                      </td>
                      <td colSpan={100} className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {hasImprints ? (
                            <>
                              {item.imprints.map((imprint) => (
                                <ImprintCard
                                  key={imprint.id}
                                  imprint={imprint}
                                  onDelete={() => handleDeleteImprint(imprint.id)}
                                  onImageClick={onImageClick}
                                />
                              ))}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 px-2 ml-1"
                            onClick={() => handleAddImprintForItem(item.id)}
                          >
                            <Plus size={12} weight="bold" />
                            Add
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface NewOrderCustomer {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
}

interface NewOrderState {
  customer: NewOrderCustomer | null;
  nickname: string;
  notes: string;
  productionNotes: string;
  dueDate: string;
  status: string;
}

interface OrderDetailPageProps {
  visualId: string;
  onViewCustomer: (customerId: string) => void;
  mode?: 'order' | 'quote' | 'create';
  onConvertSuccess?: (orderId: string) => void;
  onCreateSuccess?: (orderId: string) => void;
}

export function OrderDetailPage({ visualId, onViewCustomer, mode = 'order', onConvertSuccess, onCreateSuccess }: OrderDetailPageProps) {
  // Check if we're in create mode
  const isCreateMode = mode === 'create';

  // Use different hooks based on mode (skip fetching in create mode)
  const orderHook = useOrderDetail(mode === 'order' ? visualId : null);
  const quoteHook = useQuoteDetail(mode === 'quote' ? visualId : null);

  const { order, loading, error, refetch } = isCreateMode
    ? { order: null, loading: false, error: null, refetch: () => {} }
    : mode === 'order' ? orderHook : quoteHook;

  // State for create mode
  const [newOrder, setNewOrder] = useState<NewOrderState>({
    customer: null,
    nickname: '',
    notes: '',
    productionNotes: '',
    dueDate: '',
    status: 'DRAFT',
  });
  const [saving, setSaving] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [converting, setConverting] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Helper to check if this is a quote
  const isQuote: boolean = mode === 'quote' || (order !== null && 'isQuote' in order && order.isQuote === true);

  // Handle convert to order
  const handleConvertToOrder = async () => {
    if (!order || !isQuote) return;

    setConverting(true);
    try {
      const result = await convertToOrder(order.id);
      toast.success(`Converted to Order #${result.visual_id}`);
      if (onConvertSuccess) {
        onConvertSuccess(result.visual_id);
      }
    } catch (err) {
      toast.error('Failed to convert quote to order');
      console.error('Convert error:', err);
    } finally {
      setConverting(false);
    }
  };

  // Handle SMS notification
  const handleSendSms = async (type: 'ready' | 'payment' | 'shipped') => {
    if (!order) return;

    if (!order.customer.phone) {
      toast.error('No phone number on file for this customer');
      return;
    }

    setSendingSms(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${order.id}/notify-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send SMS');
      }

      const labels = {
        ready: 'Ready for Pickup',
        payment: 'Payment Needed',
        shipped: 'Shipped'
      };
      toast.success(`SMS sent: ${labels[type]}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SMS');
      console.error('SMS error:', err);
    } finally {
      setSendingSms(false);
    }
  };

  // Handle send invoice
  const handleSendInvoice = async () => {
    if (!order) return;

    if (!order.customer.email) {
      toast.error('No email address on file for this customer');
      return;
    }

    setSendingInvoice(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${order.id}/invoice/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      toast.success(`Invoice sent to ${order.customer.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invoice');
      console.error('Send invoice error:', err);
    } finally {
      setSendingInvoice(false);
    }
  };

  // Handle customer edit
  const handleEditCustomer = () => {
    if (!order) return;
    setCustomerForm({
      name: order.customer.name || '',
      email: order.customer.email || '',
      phone: order.customer.phone || '',
      company: order.customer.company || '',
    });
    setEditingCustomer(true);
  };

  const handleSaveCustomer = async () => {
    if (!order) return;

    setSavingCustomer(true);
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/customers/${order.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: customerForm.name.split(' ')[0] || customerForm.name,
          last_name: customerForm.name.split(' ').slice(1).join(' ') || '',
          email: customerForm.email,
          phone: customerForm.phone,
          company: customerForm.company,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Customer updated');
      setEditingCustomer(false);
      refetch();
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  // Handle create new customer
  const handleCreateCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setSavingCustomer(true);
    try {
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: customerForm.name.split(' ')[0] || customerForm.name,
          last_name: customerForm.name.split(' ').slice(1).join(' ') || '',
          email: customerForm.email || null,
          phone: customerForm.phone || null,
          company: customerForm.company || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create customer');

      const data = await response.json();
      const newCustomer = {
        id: data.customer?.id || data.id,
        name: customerForm.name,
        email: customerForm.email || null,
        phone: customerForm.phone || null,
        company: customerForm.company || null,
      };

      toast.success('Customer created');
      setShowCreateCustomer(false);
      setCustomerForm({ name: '', email: '', phone: '', company: '' });

      // Select the new customer in create mode
      if (mode === 'create') {
        setNewOrder({ ...newOrder, customer: newCustomer });
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  // Handle save draft (create mode)
  const handleSaveDraft = async () => {
    if (!newOrder.customer) {
      toast.error('Please select a customer');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: newOrder.customer.id,
          status: newOrder.status || 'DRAFT',
          order_nickname: newOrder.nickname || null,
          notes: newOrder.notes || '',
          production_notes: newOrder.productionNotes || '',
          due_date: newOrder.dueDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      toast.success(`Order #${data.order?.visual_id || data.id} created`);

      if (onCreateSuccess) {
        onCreateSuccess(String(data.order?.visual_id || data.order?.id || data.id));
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  // Status options matching Printavo statuses from API
  // Quote-stage statuses (before conversion to order)
  const QUOTE_STATUSES = [
    { value: 'QUOTE', label: 'Quote' },
    { value: 'Quote Out For Approval - Email', label: 'Quote Sent' },
  ];

  // Order-stage statuses (after quote approved/converted)
  const ORDER_STATUSES = [
    { value: 'PAYMENT NEEDED', label: 'Payment Needed' },
    { value: 'INVOICE PAID', label: 'Invoice Paid' },
    { value: 'MATERIALS PENDING', label: 'Materials Pending' },
    { value: 'SP - Need to Burn Screens', label: 'Burn Screens' },
    { value: 'SP - PRODUCTION', label: 'SP Production' },
    { value: 'DTG - PRODUCTION ', label: 'DTG Production' },  // Note: API has trailing space
    { value: 'READY FOR PICK UP', label: 'Ready for Pickup' },
    { value: 'COMPLETE', label: 'Complete' },
  ];

  // Filter status options based on whether this is a quote or order
  const STATUS_OPTIONS = isQuote ? QUOTE_STATUSES : ORDER_STATUSES;

  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    setStatusUpdating(true);
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Status changed to ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error('Failed to update status');
      console.error('Status update error:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Array<{ url: string; name: string; id: string }>>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [columnConfig, setColumnConfig] = useKV<ColumnConfig>('order-column-config', DEFAULT_COLUMN_CONFIG);
  const [addLineItemOpen, setAddLineItemOpen] = useState(false);
  const [inlineNewItem, setInlineNewItem] = useState<{
    description: string;
    styleNumber: string;
    color: string;
    unitCost: number;
  } | null>(null);

  const currentColumnConfig = columnConfig || DEFAULT_COLUMN_CONFIG;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [visualId]);

  const openImageModal = (images: Array<{ url: string; name: string; id: string }>, index: number = 0) => {
    setModalImages(images);
    setModalIndex(index);
    setModalOpen(true);
  };

  const handleAddLineItem = async (lineItem: Partial<OrderDetailLineItem>): Promise<boolean> => {
    if (!order) return false;

    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${order.id}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: lineItem.description,
          styleNumber: lineItem.styleNumber,
          color: lineItem.color,
          unitCost: lineItem.unitCost || 0,
          sizes: lineItem.sizes || {},
        }),
      });
      if (!response.ok) throw new Error('Failed to add line item');

      toast.success(`Line item "${lineItem.description}" added`);
      refetch();
      return true;
    } catch (err) {
      toast.error('Failed to add line item');
      console.error('Add line item error:', err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-7 bg-muted rounded w-48 mb-1.5" />
          <div className="h-3 bg-muted rounded w-32" />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="py-5">
                  <div className="animate-pulse h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Order Details</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Warning size={40} className="mx-auto mb-3 text-destructive" />
            <h3 className="text-base font-semibold mb-1">Failed to Load Order</h3>
            <p className="text-xs text-muted-foreground mb-3">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 h-8">
              <ArrowClockwise size={16} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For create mode, use a virtual empty order
  // For view mode, show "not found" if order is missing
  const displayOrder = isCreateMode ? {
    id: 0,
    orderNumber: 'NEW',
    orderNickname: newOrder.nickname || null,
    status: newOrder.status,
    printavoStatusName: newOrder.status,
    totalAmount: 0,
    amountOutstanding: 0,
    salesTax: 0,
    dueDate: newOrder.dueDate || null,
    customerDueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: newOrder.customer ? {
      id: newOrder.customer.id,
      name: newOrder.customer.name,
      email: newOrder.customer.email,
      phone: newOrder.customer.phone,
      company: newOrder.customer.company,
      city: null,
      state: null,
    } : {
      id: 0,
      name: '',
      email: null,
      phone: null,
      company: null,
      city: null,
      state: null,
    },
    customerPo: null,
    notes: newOrder.notes || null,
    productionNotes: newOrder.productionNotes || null,
    artworkCount: 0,
    artworkFiles: [],
    lineItems: [],
  } : order;

  if (!displayOrder) {
    return (
      <div className="space-y-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Package size={40} className="mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-base font-semibold mb-1">Order Not Found</h3>
            <p className="text-xs text-muted-foreground">
              Could not find order #{visualId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate total from line items if order total is missing/zero
  const calculatedTotal = displayOrder.totalAmount > 0
    ? displayOrder.totalAmount
    : displayOrder.lineItems?.reduce((sum, li) => sum + (li.totalCost || 0), 0) || 0;

  const balance = displayOrder.amountOutstanding;
  const paid = calculatedTotal - displayOrder.amountOutstanding;

  // Count files for compact display
  const productionFiles = displayOrder.artworkFiles?.filter(f => f.source === 'productionFile') || [];
  const filesCount = productionFiles.length;

  return (
    <div className="space-y-3">
      {/* Compact Header - 2 Lines */}
      <div className="bg-card/50 border border-border rounded-lg p-3">
        {/* Line 1: Order# | Status | Total | Balance | Actions */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-semibold tracking-tight whitespace-nowrap">
              {isCreateMode ? 'New Order' : `#${displayOrder.orderNumber}`}
            </h2>
            {!isCreateMode && displayOrder.orderNickname && (
              <span className="text-foreground/70 truncate">{displayOrder.orderNickname}</span>
            )}
            {isCreateMode && newOrder.nickname && (
              <span className="text-foreground/70 truncate">{newOrder.nickname}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              value={displayOrder.status}
              onValueChange={isCreateMode ? (v) => setNewOrder(prev => ({ ...prev, status: v })) : handleStatusChange}
              disabled={statusUpdating}
            >
              <SelectTrigger
                className={`h-7 w-[140px] text-xs font-medium uppercase tracking-wide border-0 ${getAPIStatusColor(displayOrder.status)}`}
                size="sm"
              >
                <SelectValue>
                  {statusUpdating ? 'Updating...' : getAPIStatusLabel(displayOrder.status)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-lg font-semibold">{formatCurrency(calculatedTotal)}</div>
            {!isCreateMode && (
              <span className={`text-sm ${balance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                Bal: {formatCurrency(balance)}
              </span>
            )}
            {isCreateMode && (
              <Button
                onClick={handleSaveDraft}
                disabled={saving || !newOrder.customer}
                size="sm"
                className="bg-primary hover:bg-primary/90 h-7"
              >
                {saving ? <CircleNotch size={14} className="animate-spin" /> : 'Save'}
              </Button>
            )}
            {isQuote && !isCreateMode && (
              <Button
                onClick={handleConvertToOrder}
                disabled={converting}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-7"
              >
                {converting ? 'Converting...' : 'Convert'}
              </Button>
            )}
            {!isCreateMode && !isQuote && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sendingSms}
                    className="h-7 gap-1.5"
                  >
                    {sendingSms ? (
                      <CircleNotch size={14} className="animate-spin" />
                    ) : (
                      <ChatText size={14} weight="bold" />
                    )}
                    SMS
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSendSms('ready')}>
                    Ready for Pickup
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendSms('payment')}>
                    Payment Needed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendSms('shipped')}>
                    Shipped
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isCreateMode && (
              <MoreActionsMenu
                onPrint={() => window.print()}
                onEmail={() => {
                  if (displayOrder.customer.email) {
                    window.location.href = `mailto:${displayOrder.customer.email}?subject=Order ${displayOrder.orderNumber}`;
                  } else {
                    toast.error('No customer email on file');
                  }
                }}
                onSendInvoice={handleSendInvoice}
                sendingInvoice={sendingInvoice}
              />
            )}
          </div>
        </div>

        {/* Line 2: Customer · Company · Email · Files · Paid · Due */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-foreground/70 min-w-0 flex-wrap">
            {isCreateMode && !newOrder.customer ? (
              <CustomerSelector
                selected={newOrder.customer}
                onSelect={(customer) => setNewOrder(prev => ({ ...prev, customer }))}
                onCreateNew={() => setShowCreateCustomer(true)}
              />
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewCustomer(String(displayOrder.customer.id))}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                    disabled={isCreateMode}
                  >
                    {displayOrder.customer.name}
                  </button>
                  {!isCreateMode && displayOrder.customer.id > 0 && (
                    <button
                      onClick={() => onViewCustomer(String(displayOrder.customer.id))}
                      className="p-0.5 text-muted-foreground hover:text-primary rounded transition-colors"
                      title="Edit customer"
                    >
                      <PencilSimple size={12} weight="bold" />
                    </button>
                  )}
                </div>
                {displayOrder.customer.company && (
                  <>
                    <span className="text-foreground/40">·</span>
                    <span className="truncate max-w-[150px]">{displayOrder.customer.company}</span>
                  </>
                )}
                {displayOrder.customer.email && (
                  <>
                    <span className="text-foreground/40">·</span>
                    <a href={`mailto:${displayOrder.customer.email}`} className="hover:text-foreground truncate max-w-[180px]">
                      {displayOrder.customer.email}
                    </a>
                  </>
                )}
                {!isCreateMode && filesCount > 0 && (
                  <>
                    <span className="text-foreground/40">·</span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {filesCount} files
                    </span>
                  </>
                )}
                {!isCreateMode && paid > 0 && (
                  <>
                    <span className="text-foreground/40">·</span>
                    <span className="text-green-400">Paid: {formatCurrency(paid)}</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/50 flex-shrink-0">
            {isCreateMode ? (
              <div className="flex items-center gap-2">
                <label>Due:</label>
                <Input
                  type="date"
                  value={newOrder.dueDate}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="h-6 w-auto text-xs"
                />
              </div>
            ) : displayOrder.dueDate && (
              <span className={new Date(displayOrder.dueDate) < new Date() && !['complete', 'shipped'].includes(displayOrder.status.toLowerCase()) ? 'text-destructive font-medium' : ''}>
                Due {formatDate(displayOrder.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Card */}
      <Card className="bg-card/50 border-border">
        <CardContent className="pt-4 pb-4">
          {/* Line Items Section Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Line Items</h3>
            {isCreateMode && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Job Name:</label>
                <Input
                  type="text"
                  value={newOrder.nickname}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="e.g. Summer Event Shirts"
                  className="h-7 w-48 text-xs"
                />
              </div>
            )}
          </div>

          {displayOrder.lineItems.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-3">
              No line items
            </p>
          ) : (
            <LineItemsTable
              items={displayOrder.lineItems}
              orderId={displayOrder.id}
              onImageClick={openImageModal}
              onRefetch={refetch}
            />
          )}

          {/* Inline New Line Item Row */}
          {inlineNewItem && (
            <div className="mt-3 p-3 bg-muted/30 border border-dashed border-primary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <Input
                    autoFocus
                    placeholder="Description *"
                    value={inlineNewItem.description}
                    onChange={(e) => setInlineNewItem({ ...inlineNewItem, description: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setInlineNewItem(null);
                    }}
                    className="bg-background"
                  />
                  <Input
                    placeholder="SKU / Style #"
                    value={inlineNewItem.styleNumber}
                    onChange={(e) => setInlineNewItem({ ...inlineNewItem, styleNumber: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setInlineNewItem(null);
                    }}
                    className="bg-background"
                  />
                  <Input
                    placeholder="Color"
                    value={inlineNewItem.color}
                    onChange={(e) => setInlineNewItem({ ...inlineNewItem, color: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setInlineNewItem(null);
                    }}
                    className="bg-background"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={inlineNewItem.unitCost || ''}
                    onChange={(e) => setInlineNewItem({ ...inlineNewItem, unitCost: parseFloat(e.target.value) || 0 })}
                    onKeyDown={async (e) => {
                      if (e.key === 'Escape') setInlineNewItem(null);
                      if (e.key === 'Enter' && inlineNewItem.description) {
                        const success = await handleAddLineItem(inlineNewItem);
                        if (success) setInlineNewItem(null);
                      }
                    }}
                    className="bg-background"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="h-8 gap-1"
                    disabled={!inlineNewItem.description}
                    onClick={async () => {
                      const success = await handleAddLineItem(inlineNewItem);
                      if (success) setInlineNewItem(null);
                    }}
                  >
                    <Check size={14} weight="bold" />
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setInlineNewItem(null)}
                  >
                    <X size={14} weight="bold" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Press Enter to save, Escape to cancel. You can add sizes and imprints after.
              </p>
            </div>
          )}

          {/* Add Line Item Button */}
          {!inlineNewItem && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8"
                onClick={() => setInlineNewItem({
                  description: '',
                  styleNumber: '',
                  color: '',
                  unitCost: 0
                })}
              >
                <Package className="w-4 h-4" weight="bold" />
                Add Line Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment + Files Row - Compact */}
      {!isCreateMode && (() => {
        const imageFiles = productionFiles.filter(f => isImageFile(f.name));
        const pdfFiles = productionFiles.filter(f => getFileExtension(f.name) === 'pdf');

        return (
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
            {/* Payment Summary - Compact */}
            <Card className="bg-card/50 border-border">
              <CardContent className="py-3 px-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Payment</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(calculatedTotal - displayOrder.salesTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(displayOrder.salesTax)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(calculatedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Paid</span>
                    <span>{formatCurrency(paid)}</span>
                  </div>
                  <div className={`flex justify-between ${balance > 0 ? 'text-yellow-400 font-medium' : 'text-green-400'}`}>
                    <span>Balance</span>
                    <span>{formatCurrency(balance)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Production Files - Compact */}
            {productionFiles.length > 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-3 px-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FileText size={12} weight="bold" />
                    Files ({productionFiles.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {/* Image thumbnails */}
                    {imageFiles.slice(0, 8).map((file, idx) => (
                      <button
                        key={file.id}
                        onClick={() => openImageModal(imageFiles, idx)}
                        className="w-10 h-10 rounded border border-border bg-muted hover:border-primary transition-colors overflow-hidden"
                      >
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {/* PDF thumbnails */}
                    {pdfFiles.slice(0, 4).map((file) => (
                      <PdfThumbnail
                        key={file.id}
                        thumbnailUrl={file.thumbnail_url}
                        pdfUrl={file.url}
                        name={file.name}
                        size="small"
                      />
                    ))}
                    {/* Show more indicator */}
                    {productionFiles.length > 12 && (
                      <div className="w-10 h-10 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +{productionFiles.length - 12}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border border-dashed">
                <CardContent className="py-3 px-3 flex items-center justify-center text-sm text-muted-foreground">
                  No production files
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Production Notes */}
      {(isCreateMode || displayOrder.productionNotes) && (
        <Card className="bg-card border-border">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Production Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            {isCreateMode ? (
              <Textarea
                value={newOrder.productionNotes}
                onChange={(e) => setNewOrder(prev => ({ ...prev, productionNotes: e.target.value }))}
                placeholder="Add production notes (artwork instructions, print specs, etc.)"
                className="min-h-[80px] text-xs"
              />
            ) : (
              <div
                className="text-xs text-muted-foreground prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: displayOrder.productionNotes || '' }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {(isCreateMode || displayOrder.notes) && (
        <Card className="bg-card border-border">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            {isCreateMode ? (
              <Textarea
                value={newOrder.notes}
                onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add general notes about this order"
                className="min-h-[80px] text-xs"
              />
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {displayOrder.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <ImageModal
        images={modalImages}
        currentIndex={modalIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onNavigate={setModalIndex}
      />

      <AddLineItemDialog
        open={addLineItemOpen}
        onOpenChange={setAddLineItemOpen}
        onAdd={handleAddLineItem}
      />

      {/* Customer Edit Dialog */}
      <Dialog open={editingCustomer} onOpenChange={setEditingCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Company</label>
              <Input
                value={customerForm.company}
                onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} disabled={savingCustomer}>
              {savingCustomer ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateCustomer} onOpenChange={(open) => {
        setShowCreateCustomer(open);
        if (!open) setCustomerForm({ name: '', email: '', phone: '', company: '' });
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name *</label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Company</label>
              <Input
                value={customerForm.company}
                onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateCustomer(false);
              setCustomerForm({ name: '', email: '', phone: '', company: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={savingCustomer || !customerForm.name.trim()}>
              {savingCustomer ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LineItemCardProps {
  item: OrderDetailLineItem;
  index: number;
  orderId: number;
  orderStatus: string;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
  columnConfig: ColumnConfig;
  onConfigChange: (config: ColumnConfig) => void;
  onRefetch: () => void;
}

interface ImprintCardProps {
  imprint: LineItemImprint;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
  onDelete?: () => void;
  isLineItemEditing?: boolean;
}

function ImprintCard({ imprint, onImageClick, onDelete, isLineItemEditing = false }: ImprintCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedImprint, setEditedImprint] = useState(imprint);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedImprint(imprint);
  };
  
  const handleSave = () => {
    toast.success('Imprint updated');
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedImprint(imprint);
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    toast.success('Imprint deleted');
  };

  const handleMockupUpload = (files: File[]) => {
    toast.success(`${files.length} mockup${files.length > 1 ? 's' : ''} uploaded successfully`);
    // In a real implementation, this would upload the files and update the imprint
  };
  
  return (
    <div className="p-2 bg-card/50 rounded border border-border/50 space-y-1.5 relative group">
      {/* Edit/Delete controls */}
      {!isLineItemEditing && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          {isEditing ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={handleSave}
                title="Save changes"
              >
                <Check size={14} weight="bold" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={handleCancel}
                title="Cancel editing"
              >
                <X size={14} weight="bold" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleEdit}
                title="Edit imprint"
              >
                <PencilSimple size={14} weight="bold" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                title="Delete imprint"
              >
                <Trash size={14} weight="bold" />
              </Button>
            </>
          )}
        </div>
      )}
      
      <div className="flex items-start gap-2">
        <Stamp className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" weight="duotone" />
        <div className="flex-1 min-w-0 pr-12">
          {isEditing ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Input
                  value={editedImprint.location || ''}
                  onChange={(e) => setEditedImprint({ ...editedImprint, location: e.target.value })}
                  className="h-6 text-xs font-medium flex-1"
                  placeholder="Location (e.g., Front, Back)"
                />
                <Input
                  value={editedImprint.decorationType || ''}
                  onChange={(e) => setEditedImprint({ ...editedImprint, decorationType: e.target.value })}
                  className="h-6 text-xs w-28"
                  placeholder="Type"
                />
              </div>
              <Textarea
                value={editedImprint.description || ''}
                onChange={(e) => setEditedImprint({ ...editedImprint, description: e.target.value })}
                className="text-[10px] min-h-[40px] resize-none"
                placeholder="Description"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium">
                  {imprint.location || 'Imprint'}
                </span>
                {imprint.decorationType && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-primary/10 text-primary">
                    {imprint.decorationType}
                  </Badge>
                )}
              </div>
              {imprint.description && imprint.description !== imprint.location && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {imprint.description.split('\n').slice(1).join(' ').trim() || ''}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Mockups for this imprint */}
      <div className="pl-5 pt-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Mockups ({imprint.mockups?.length || 0})
          </p>
          {!isLineItemEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="w-3 h-3 mr-1" weight="bold" />
              Add
            </Button>
          )}
        </div>
        {imprint.mockups && imprint.mockups.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {imprint.mockups.map((mockup, idx) => (
              isPdfUrl(mockup.url) ? (
                <PdfThumbnail
                  key={mockup.id}
                  thumbnailUrl={mockup.thumbnail_url}
                  pdfUrl={mockup.url}
                  name={mockup.name || 'Imprint mockup'}
                  size="small"
                  className="w-14 h-14"
                />
              ) : (
                <button
                  key={mockup.id}
                  onClick={() => {
                    const allMockups = imprint.mockups?.map(m => ({
                      // Use thumbnail for display, fall back to URL (handles PDF files)
                      url: m.thumbnail_url || m.url,
                      name: m.name || 'Imprint mockup',
                      id: String(m.id)
                    })) || [];
                    onImageClick?.(allMockups, idx);
                  }}
                  className="w-14 h-14 flex-shrink-0 rounded border-2 border-border bg-muted hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  title={mockup.name || 'Mockup'}
                >
                  <img
                    src={mockup.thumbnail_url || mockup.url}
                    alt={mockup.name || 'Imprint mockup'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>
              )
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 italic">No mockups yet</p>
        )}
      </div>

      <MockupUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleMockupUpload}
        title={`Upload Mockups for ${imprint.location || 'Imprint'}`}
      />
    </div>
  );
}

const ADULT_SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;

function LineItemCard({ item, index, orderId, orderStatus, onImageClick, columnConfig, onConfigChange, onRefetch }: LineItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const [editedSizes, setEditedSizes] = useState(mapSizesToGrid(item.sizes));
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [mockupUploadOpen, setMockupUploadOpen] = useState(false);
  const [addImprintOpen, setAddImprintOpen] = useState(false);
  
  const sizes = isEditing ? editedSizes : mapSizesToGrid(item.sizes);
  const total = Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
  
  const handleDuplicate = async () => {
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: item.description,
          styleNumber: item.styleNumber,
          color: item.color,
          unitCost: item.unitCost,
          sizes: item.sizes,
        }),
      });
      if (!response.ok) throw new Error('Failed to duplicate line item');

      toast.success('Line item duplicated');
      onRefetch();
    } catch (err) {
      toast.error('Failed to duplicate line item');
      console.error('Duplicate error:', err);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/line-items/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete line item');

      toast.success('Line item deleted');
      onRefetch();
    } catch (err) {
      toast.error('Failed to delete line item');
      console.error('Delete error:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedItem(item);
    setEditedSizes(mapSizesToGrid(item.sizes));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/line-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editedItem.description,
          styleNumber: editedItem.styleNumber,
          color: editedItem.color,
          unitCost: editedItem.unitCost,
          sizes: editedSizes,
        }),
      });
      if (!response.ok) throw new Error('Failed to update line item');

      toast.success('Line item updated');
      setIsEditing(false);
      onRefetch();
    } catch (err) {
      toast.error('Failed to update line item');
      console.error('Update error:', err);
    }
  };
  
  const handleCancel = () => {
    setEditedItem(item);
    setEditedSizes(mapSizesToGrid(item.sizes));
    setIsEditing(false);
  };
  
  const handleSizeChange = (size: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedSizes(prev => ({ ...prev, [size]: numValue }));
  };

  const handleMockupUpload = (files: File[]) => {
    toast.success(`${files.length} mockup${files.length > 1 ? 's' : ''} uploaded to line item`);
    // In a real implementation, this would upload the files and update the line item
  };

  const handleAddImprint = async (imprint: Partial<LineItemImprint>) => {
    try {
      const response = await fetch(`https://mintprints-api.ronny.works/api/orders/${orderId}/imprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_item_id: item.id,
          location: imprint.location || 'New Location',
          decoration_type: imprint.decorationType || 'Screen Printing',
          description: imprint.description || '',
          color_count: imprint.colorCount || 1,
          colors: imprint.colors || '',
        }),
      });

      if (!response.ok) throw new Error('Failed to add imprint');

      toast.success(`Imprint "${imprint.location}" added`);
      onRefetch();
    } catch (error) {
      console.error('Failed to add imprint:', error);
      toast.error('Failed to add imprint');
    }
  };

  const lineItemMockups = item.mockup ? [item.mockup] : [];
  const allLineItemMockups = lineItemMockups.sort((a, b) => {
    const aIsPdf = a.url?.toLowerCase().endsWith('.pdf');
    const bIsPdf = b.url?.toLowerCase().endsWith('.pdf');
    if (aIsPdf && !bIsPdf) return 1;
    if (!aIsPdf && bIsPdf) return -1;
    return 0;
  });

  return (
    <>
      <div className="p-3 bg-secondary/30 rounded-lg space-y-3 relative">
        {/* 3-dot menu */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {isEditing ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={handleSave}
                title="Save changes"
              >
                <Check size={18} weight="bold" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={handleCancel}
                title="Cancel editing"
              >
                <X size={18} weight="bold" />
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <DotsThree size={18} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                  <PencilSimple className="w-4 h-4" weight="bold" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMockupUploadOpen(true)} className="gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" weight="bold" />
                  Upload Mockup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer">
                  <Copy className="w-4 h-4" weight="bold" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-destructive">
                  <Trash className="w-4 h-4" weight="bold" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManageColumnsOpen(true)} className="gap-2 cursor-pointer">
                  <Columns className="w-4 h-4" weight="bold" />
                  Manage Columns
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">#{index + 1}</span>
              {isEditing ? (
                <Input
                  value={editedItem.description || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                  className="h-7 text-sm font-medium flex-1"
                  placeholder="Line item description"
                />
              ) : (
                <h4 className="font-medium text-sm truncate">
                  {item.description || item.styleNumber || 'Line Item'}
                </h4>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isEditing ? (
                <>
                  {columnConfig.itemNumber && (
                    <Input
                      value={editedItem.styleNumber || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, styleNumber: e.target.value })}
                      className="h-6 text-xs w-24"
                      placeholder="SKU"
                    />
                  )}
                  {columnConfig.itemNumber && columnConfig.color && <span>•</span>}
                  {columnConfig.color && (
                    <Input
                      value={editedItem.color || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, color: e.target.value })}
                      className="h-6 text-xs w-24"
                      placeholder="Color"
                    />
                  )}
                </>
              ) : (
                <>
                  {columnConfig.itemNumber && item.styleNumber && <span>{item.styleNumber}</span>}
                  {columnConfig.itemNumber && columnConfig.color && item.styleNumber && item.color && <span>•</span>}
                  {columnConfig.color && item.color && <span>{item.color}</span>}
                  {columnConfig.category && item.category && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {item.category}
                      </Badge>
                    </>
                  )}
                  {!columnConfig.itemNumber && !columnConfig.color && !columnConfig.category && item.styleNumber && (
                    <span>{item.styleNumber}</span>
                  )}
                  {!columnConfig.itemNumber && !columnConfig.color && !columnConfig.category && item.styleNumber && item.color && (
                    <span>•</span>
                  )}
                  {!columnConfig.itemNumber && !columnConfig.color && !columnConfig.category && item.color && (
                    <span>{item.color}</span>
                  )}
                </>
              )}
            </div>
          </div>
          
          
          <div className="text-right">
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  type="number"
                  value={editedItem.unitCost}
                  onChange={(e) => setEditedItem({ ...editedItem, unitCost: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-sm font-medium w-24 text-right"
                  step="0.01"
                  placeholder="Unit cost"
                />
                <div className="text-xs text-muted-foreground">
                  {total} × {formatCurrency(editedItem.unitCost)}
                </div>
              </div>
            ) : (
              <>
                <div className="font-medium text-sm">{formatCurrency(item.totalCost)}</div>
                <div className="text-xs text-muted-foreground">
                  {item.totalQuantity} × {formatCurrency(item.unitCost)}
                </div>
              </>
            )}
          </div>
          
          {/* Mockup Thumbnail - Right Side */}
          {allLineItemMockups.length > 0 && allLineItemMockups[0] && (
            isPdfUrl(allLineItemMockups[0].url) ? (
              <PdfThumbnail
                thumbnailUrl={allLineItemMockups[0].thumbnail_url}
                pdfUrl={allLineItemMockups[0].url}
                name={allLineItemMockups[0].name}
                size="large"
              />
            ) : (
              <button
                onClick={() => onImageClick?.(allLineItemMockups, 0)}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-colors cursor-pointer"
              >
                <img
                  src={allLineItemMockups[0].url}
                  alt={allLineItemMockups[0].name}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          )}
        </div>

        {/* Size Grid */}
        <div className="inline-flex gap-0.5 text-xs">
          {ADULT_SIZE_LABELS.filter(size => columnConfig.sizes.adult[size as keyof typeof columnConfig.sizes.adult]).map(size => (
            <div
              key={size}
              className="flex flex-col items-center min-w-[36px]"
            >
              <span className="text-muted-foreground font-medium px-1.5 py-0.5">
                {size}
              </span>
              {isEditing ? (
                <Input
                  type="number"
                  value={sizes[size]}
                  onChange={(e) => handleSizeChange(size, e.target.value)}
                  className="h-7 w-12 text-center text-xs p-0"
                  min="0"
                />
              ) : (
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    sizes[size] > 0
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  {sizes[size]}
                </span>
              )}
            </div>
          ))}
          {columnConfig.quantity && (
            <div className="flex flex-col items-center min-w-[44px] border-l border-border pl-1 ml-1">
              <span className="text-muted-foreground font-medium px-1.5 py-0.5">
                Total
              </span>
              <span className="px-1.5 py-0.5 font-semibold">
                {total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Imprints Section */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Printer className="w-3 h-3" weight="bold" />
          Imprints
        </p>
        
        {/* Imprint Details with Mockups */}
        {item.imprints && item.imprints.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {item.imprints.map((imprint) => (
              <ImprintCard 
                key={imprint.id} 
                imprint={imprint} 
                onImageClick={onImageClick}
                isLineItemEditing={isEditing}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-9 h-9 flex-shrink-0 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center">
              <Image className="w-3.5 h-3.5 text-muted-foreground/50" weight="duotone" />
            </div>
            <span className="text-xs text-muted-foreground">No imprints</span>
          </div>
        )}
        
        {/* Add Imprint Button */}
        {!isEditing && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 border border-dashed border-border hover:border-primary hover:bg-primary/5"
              onClick={() => setAddImprintOpen(true)}
            >
              <Printer className="w-3.5 h-3.5" weight="bold" />
              Add Imprint
            </Button>
          </div>
        )}
      </div>

      <MockupUploadDialog
        open={mockupUploadOpen}
        onOpenChange={setMockupUploadOpen}
        onUpload={handleMockupUpload}
        title={`Upload Mockups for ${item.description || 'Line Item'}`}
      />

      <AddImprintDialog
        open={addImprintOpen}
        onOpenChange={setAddImprintOpen}
        onAdd={handleAddImprint}
        lineItemDescription={item.description || item.styleNumber || undefined}
      />

      <ManageColumnsModal
        open={manageColumnsOpen}
        onOpenChange={setManageColumnsOpen}
        config={columnConfig}
        onChange={onConfigChange}
      />
    </>
  );
}
