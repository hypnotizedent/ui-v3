import { useState, useEffect } from 'react';
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
  Plus
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';
import { SizeBreakdown } from '@/lib/types';
import { ImageModal } from '@/components/shared/ImageModal';
import { ManageColumnsModal, ColumnConfig, DEFAULT_COLUMN_CONFIG } from './ManageColumnsModal';
import { toast } from 'sonner';

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
      sizes: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0, xxxxxl: 0, other: 0 },
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
  
  // Debug logging
  useEffect(() => {
    console.log('LineItemsTable - Items:', items);
    console.log('LineItemsTable - Items with imprints:', items.filter(i => i.imprints && i.imprints.length > 0));
    console.log('LineItemsTable - Items with mockups:', items.filter(i => i.mockup));
    console.log('LineItemsTable - Expanded items:', Array.from(expandedItems));
    console.log('LineItemsTable - Column config:', currentColumnConfig);
  }, [items, expandedItems, currentColumnConfig]);
  
  const sizeColumns = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;
  const visibleSizeColumns = sizeColumns.filter(size => 
    currentColumnConfig.sizes.adult[size as keyof typeof currentColumnConfig.sizes.adult]
  );
  
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
  
  const mapSizesToDisplay = (sizes: OrderDetailLineItem['sizes']): Record<string, number> => {
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

  const handleImprintCellBlur = () => {
    if (editingImprintCell) {
      toast.success('Imprint updated');
      setEditingImprintCell(null);
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
              {visibleSizeColumns.map(size => (
                <th key={size} className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  {size}
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
              
              const totalQty = visibleSizeColumns.reduce((sum, size) => {
                const sizeKey = `size-${size}`;
                const qty = sizeKey in editedSizes ? Number(editedSizes[sizeKey as keyof typeof editedSizes] || 0) : sizes[size];
                return sum + qty;
              }, 0);
              
              const unitCost = getItemValue(item, 'unitCost');
              const totalCost = totalQty * Number(unitCost);
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
                        {hasImprints && (
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                            title={isExpanded ? 'Collapse imprints' : 'Expand imprints'}
                          >
                            <svg
                              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    {currentColumnConfig.itemNumber && renderEditableCell(item, 'styleNumber', 'left')}
                    {currentColumnConfig.color && renderEditableCell(item, 'color', 'left')}
                    {renderEditableCell(item, 'description', 'left')}
                    <td className="px-3 py-1.5 align-top text-center">
                      <div className="h-7 flex items-center justify-center">
                        {item.mockup ? (
                          <button
                            onClick={() => {
                              if (item.mockup) {
                                onImageClick?.([{
                                  url: item.mockup.url,
                                  name: item.mockup.name || 'Line item mockup',
                                  id: item.mockup.id
                                }], 0);
                              }
                            }}
                            className="w-10 h-10 flex-shrink-0 rounded border border-border bg-card hover:border-primary hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                            title={item.mockup.name || 'Mockup'}
                          >
                            <img
                              src={item.mockup.thumbnail_url || item.mockup.url}
                              alt={item.mockup.name || 'Line item mockup'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    {visibleSizeColumns.map(size => renderEditableCell(item, `size-${size}`, 'center'))}
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
                  
                  {/* Imprint Rows */}
                  {isExpanded && hasImprints && item.imprints.map((imprint, imprintIdx) => (
                    <tr key={`imprint-${imprint.id}`} className="bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border/50 hover:from-muted/50 hover:to-muted/30 transition-colors">
                      <td className="px-3 py-1.5 align-top">
                        <div className="h-7 flex items-center justify-center">
                          <div className="w-1 h-4 bg-primary/30 rounded-full"></div>
                        </div>
                      </td>
                      {currentColumnConfig.itemNumber && (
                        <td className="px-3 py-1.5 align-top">
                          <div className="h-7 flex items-center">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                              {imprint.decorationType || 'Imprint'}
                            </Badge>
                          </div>
                        </td>
                      )}
                      {currentColumnConfig.color && (
                        <td className="px-3 py-1.5 align-top"></td>
                      )}
                      {renderEditableImprintCell(imprint, 'description', 'left', 1)}
                      <td className="px-3 py-1.5 align-top text-center">
                        <div className="h-7 flex items-center justify-center gap-1">
                          {imprint.mockups && imprint.mockups.length > 0 ? (
                            <>
                              {imprint.mockups.slice(0, 2).map((mockup, idx) => (
                                <button
                                  key={mockup.id}
                                  onClick={() => {
                                    const allMockups = imprint.mockups?.map(m => ({
                                      url: m.url,
                                      name: m.name || 'Imprint mockup',
                                      id: String(m.id)
                                    })) || [];
                                    onImageClick?.(allMockups, idx);
                                  }}
                                  className="w-7 h-7 flex-shrink-0 rounded border border-border bg-card hover:border-primary hover:shadow-sm transition-all cursor-pointer overflow-hidden"
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
                              ))}
                              {imprint.mockups.length > 2 && (
                                <span className="text-[9px] text-muted-foreground">
                                  +{imprint.mockups.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      {renderEditableImprintCell(imprint, 'location', 'left', Math.max(2, Math.floor(visibleSizeColumns.length / 4)))}
                      {renderEditableImprintCell(imprint, 'colors', 'left', Math.max(2, Math.floor(visibleSizeColumns.length / 4)))}
                      <td 
                        className="px-3 py-1.5 align-top" 
                        colSpan={visibleSizeColumns.length - Math.floor(visibleSizeColumns.length / 3) * 2}
                      >
                        <div className="h-7 flex items-center gap-1 text-xs text-muted-foreground">
                          {imprint.width && imprint.height && (
                            <span>{imprint.width}" × {imprint.height}"</span>
                          )}
                        </div>
                      </td>
                      {currentColumnConfig.quantity && <td></td>}
                      <td colSpan={4}></td>
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface OrderDetailPageProps {
  visualId: string;
  onViewCustomer: (customerId: string) => void;
  mode?: 'order' | 'quote';
  onConvertSuccess?: (orderId: string) => void;
}

export function OrderDetailPage({ visualId, onViewCustomer, mode = 'order', onConvertSuccess }: OrderDetailPageProps) {
  // Use different hooks based on mode
  const orderHook = useOrderDetail(mode === 'order' ? visualId : null);
  const quoteHook = useQuoteDetail(mode === 'quote' ? visualId : null);

  const { order, loading, error, refetch } = mode === 'order' ? orderHook : quoteHook;
  const [converting, setConverting] = useState(false);

  // Helper to check if this is a quote
  const isQuote = mode === 'quote' || (order && 'isQuote' in order && order.isQuote);

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

  // Status options from database
  const STATUS_OPTIONS = [
    { value: 'QUOTE', label: 'Quote' },
    { value: 'Quote Out For Approval - Email', label: 'Quote Sent' },
    { value: 'PAYMENT NEEDED', label: 'Payment Needed' },
    { value: 'INVOICE PAID', label: 'Invoice Paid' },
    { value: 'MATERIALS PENDING', label: 'Materials Pending' },
    { value: 'SP - Need to Burn Screens', label: 'Burn Screens' },
    { value: 'SP - PRODUCTION', label: 'SP Production' },
    { value: 'DTG - PRODUCTION', label: 'DTG Production' },
    { value: 'READY FOR PICK UP', label: 'Ready for Pickup' },
    { value: 'COMPLETE', label: 'Complete' },
  ];

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
  
  const currentColumnConfig = columnConfig || DEFAULT_COLUMN_CONFIG;

  // Debug logging
  useEffect(() => {
    console.log('OrderDetailPage mounted', { visualId, loading, error: error?.message, hasOrder: !!order });
  }, [visualId, loading, error, order]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [visualId]);

  const openImageModal = (images: Array<{ url: string; name: string; id: string }>, index: number = 0) => {
    setModalImages(images);
    setModalIndex(index);
    setModalOpen(true);
  };

  const handleAddLineItem = async (lineItem: Partial<OrderDetailLineItem>) => {
    if (!order) return;

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
    } catch (err) {
      toast.error('Failed to add line item');
      console.error('Add line item error:', err);
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

  if (!order) {
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

  const balance = order.amountOutstanding;
  const paid = order.totalAmount - order.amountOutstanding;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            #{order.orderNumber}
            {order.orderNickname && (
              <span className="text-muted-foreground"> · {order.orderNickname}</span>
            )}
            <span className="text-[10px] text-emerald-500 ml-2 font-normal">● Updated</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-0.5">
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={statusUpdating}
              >
                <SelectTrigger
                  className={`h-7 w-[160px] text-xs font-medium uppercase tracking-wide border-0 ${getAPIStatusColor(order.status)}`}
                  size="sm"
                >
                  <SelectValue>
                    {statusUpdating ? 'Updating...' : getAPIStatusLabel(order.status)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-xs"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xl font-semibold">{formatCurrency(order.totalAmount)}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Balance:{' '}
              <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                {formatCurrency(balance)}
              </span>
            </p>
          </div>
          {/* Convert to Order button for quotes */}
          {isQuote && (
            <Button
              onClick={handleConvertToOrder}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {converting ? 'Converting...' : 'Convert to Order'}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Minimal Info Bar - Customer and Dates */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="py-2 px-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Customer Info - Left */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onViewCustomer(String(order.customer.id))}
                  className="font-semibold text-sm text-foreground hover:text-primary hover:underline text-left"
                >
                  {order.customer.name}
                </button>
                {order.customer.company && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-muted-foreground text-xs">{order.customer.company}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {order.customer.email && (
                  <a href={`mailto:${order.customer.email}`} className="hover:text-foreground">
                    {order.customer.email}
                  </a>
                )}
                {order.customer.email && order.customer.phone && <span>·</span>}
                {order.customer.phone && (
                  <a href={`tel:${order.customer.phone}`} className="hover:text-foreground">
                    {order.customer.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Dates - Right */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {order.createdAt && (
                <>
                  <span className="text-muted-foreground">Created {formatDate(order.createdAt)}</span>
                  <span className="text-muted-foreground">·</span>
                </>
              )}
              {order.dueDate && (
                <span
                  className={`text-muted-foreground ${
                    new Date(order.dueDate) < new Date() &&
                    order.status.toLowerCase() !== 'complete' &&
                    order.status.toLowerCase() !== 'shipped'
                      ? 'text-destructive font-medium'
                      : ''
                  }`}
                >
                  Due {formatDate(order.dueDate)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <Separator className="my-0" />
        
        <CardContent className="pt-4 pb-4">
          {/* Line Items Section Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Line Items</h3>
          </div>
          
          {order.lineItems.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-3">
              No line items
            </p>
          ) : (
            <LineItemsTable
              items={order.lineItems}
              orderId={order.id}
              onImageClick={openImageModal}
              onRefetch={refetch}
            />
          )}
          
          {/* Add Line Item Button */}
          <div className="pt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => setAddLineItemOpen(true)}
            >
              <Package className="w-4 h-4" weight="bold" />
              Add Line Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Production Files - Collapsible */}
      {(() => {
        const productionFiles = order.artworkFiles.filter(f => f.source === 'productionFile');
        const imageFiles = productionFiles.filter(f => isImageFile(f.name));
        const pdfFiles = productionFiles.filter(f => getFileExtension(f.name) === 'pdf');
        const otherFiles = productionFiles.filter(f => !isImageFile(f.name) && getFileExtension(f.name) !== 'pdf');
        
        return productionFiles.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" weight="bold" />
                Production Files ({productionFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-3">
              {/* Image Files with Previews */}
              {imageFiles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Images ({imageFiles.length})
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                    {imageFiles.map((file, idx) => (
                      <button
                        key={file.id}
                        onClick={() => openImageModal(imageFiles, idx)}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary transition-colors cursor-pointer"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <FileImage className="w-5 h-5 text-white" weight="bold" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* PDF Files with Thumbnails */}
              {pdfFiles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    PDFs ({pdfFiles.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pdfFiles.map((file) => (
                      <div key={file.id} className="flex flex-col gap-1">
                        <PdfThumbnail
                          thumbnailUrl={file.thumbnail_url}
                          pdfUrl={file.url}
                          name={file.name}
                          size="large"
                        />
                        <p className="text-[10px] text-muted-foreground text-center truncate max-w-[96px]">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Other Files */}
              {otherFiles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Other Files ({otherFiles.length})
                  </p>
                  <div className="grid gap-1.5">
                    {otherFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{getFileExtension(file.name).toUpperCase()} file</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Production Notes */}
      {order.productionNotes && (
        <Card className="bg-card border-border">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Production Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div
              className="text-xs text-muted-foreground prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: order.productionNotes }}
            />
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {order.notes && (
        <Card className="bg-card border-border">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {order.notes}
            </p>
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
  isLineItemEditing: boolean;
}

function ImprintCard({ imprint, onImageClick, isLineItemEditing }: ImprintCardProps) {
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
                      url: m.url,
                      name: m.name || 'Imprint mockup',
                      id: String(m.id)
                    })) || [];
                    onImageClick?.(allMockups, idx);
                  }}
                  className="w-14 h-14 flex-shrink-0 rounded border-2 border-border bg-muted hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  title={mockup.name || 'Mockup'}
                >
                  <img
                    src={mockup.url}
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

  const handleAddImprint = (imprint: Partial<LineItemImprint>) => {
    toast.success(`Imprint "${imprint.location}" added to line item`);
    // In a real implementation, this would add the imprint to the line item
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
