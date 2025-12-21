import { useState } from 'react';
import { Order, Transaction, LineItem, Imprint, ImprintLocation, ImprintMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, Calendar, FileText, Printer, CreditCard, 
  Image, CheckCircle, XCircle, Pencil, Upload, X, FilePdf, FileImage 
} from '@phosphor-icons/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { 
  formatCurrency, formatDate, 
  getPaymentMethodLabel 
} from '@/lib/helpers';
import { SizeGrid } from '@/components/shared/SizeGrid';
import { toast } from 'sonner';

interface OrderDetailProps {
  order: Order;
  transactions: Transaction[];
  onViewCustomer: (customerId: string) => void;
}

export function OrderDetail({ order, transactions, onViewCustomer }: OrderDetailProps) {
  const totalPaid = transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRefunded = transactions
    .filter(t => t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = order.total - totalPaid + totalRefunded;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Order #{order.visual_id}
            </h2>
            <StatusBadge status={order.status} />
          </div>
          {order.nickname && (
            <p className="text-muted-foreground mt-1">{order.nickname}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatCurrency(order.total)}</div>
          <p className="text-sm text-muted-foreground">
            Balance: <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
              {formatCurrency(balance)}
            </span>
          </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" weight="bold" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.line_items.map((item, index) => (
                <LineItemCard key={item.id} item={item} index={index} />
              ))}
            </CardContent>
          </Card>
          
          {order.production_notes && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium">Production Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {order.production_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4" weight="bold" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => onViewCustomer(order.customer_id)}
                className="text-primary hover:underline font-medium text-left"
              >
                {order.customer_name}
              </button>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" weight="bold" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className={new Date(order.due_date) < new Date() && order.status !== 'COMPLETE' && order.status !== 'SHIPPED' ? 'text-destructive' : ''}>
                  {formatDate(order.due_date)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" weight="bold" />
                Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Paid</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
                {totalRefunded > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Refunded</span>
                    <span>-{formatCurrency(totalRefunded)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Balance Due</span>
                  <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
              
              {transactions.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Transaction History
                  </p>
                  <div className="space-y-2">
                    {transactions.map(tx => (
                      <div key={tx.id} className="text-sm flex justify-between items-start">
                        <div>
                          <span className={tx.type === 'refund' ? 'text-destructive' : 'text-green-400'}>
                            {tx.type === 'payment' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {getPaymentMethodLabel(tx.method)}
                            {tx.reference && ` • ${tx.reference}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LineItemCard({ item, index }: { item: LineItem; index: number }) {
  const mockups: string[] = [];
  const [imprints, setImprints] = useState<Imprint[]>(item.imprints);
  
  const handleImprintUpdate = (updatedImprint: Imprint) => {
    setImprints(prev => prev.map(imp => 
      imp.id === updatedImprint.id ? updatedImprint : imp
    ));
  };
  
  return (
    <div className="p-4 bg-secondary/30 rounded-lg flex gap-4">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">#{index + 1}</span>
          <span>{item.product_sku}</span>
          <span>•</span>
          <span>{item.product_color}</span>
        </div>
        
        <h4 className="font-medium text-base">{item.product_name}</h4>
        
        <div className="flex items-baseline gap-3">
          <div className="font-semibold text-lg">{formatCurrency(item.subtotal)}</div>
          <div className="text-sm text-muted-foreground">
            {item.quantity} × {formatCurrency(item.unit_price)}
          </div>
        </div>
        
        <SizeGrid sizes={item.sizes} />
        
        {imprints.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Printer className="w-3 h-3" weight="bold" />
              Imprints
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {imprints.map(imprint => (
                <ImprintCard 
                  key={imprint.id} 
                  imprint={imprint} 
                  onUpdate={handleImprintUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 self-center">
        <div className="w-24 h-24 bg-muted rounded-lg border border-border flex items-center justify-center">
          {mockups.length > 0 ? (
            <img src={mockups[0]} alt="Product mockup" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Image className="w-8 h-8 text-muted-foreground" weight="bold" />
          )}
        </div>
      </div>
    </div>
  );
}

function ImprintCard({ imprint, onUpdate }: { imprint: Imprint; onUpdate: (imprint: Imprint) => void }) {
  const mockups: string[] = [];
  const [isEditing, setIsEditing] = useState(false);
  const [editedImprint, setEditedImprint] = useState<Imprint>(imprint);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSave = () => {
    if (uploadedFiles.length > 0) {
      toast.success(`Changes saved with ${uploadedFiles.length} new file${uploadedFiles.length > 1 ? 's' : ''}`);
    } else {
      toast.success('Changes saved');
    }
    onUpdate(editedImprint);
    setIsEditing(false);
    setUploadedFiles([]);
  };
  
  const locationOptions: ImprintLocation[] = ['Front', 'Back', 'Left Chest', 'Right Sleeve', 'Left Sleeve', 'Neck'];
  const methodOptions: ImprintMethod[] = ['screen-print', 'dtg', 'embroidery', 'vinyl', 'digital-transfer'];
  
  const formatMethodLabel = (method: ImprintMethod) => {
    return method.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-6 h-6" weight="bold" />;
    } else if (file.type === 'application/pdf') {
      return <FilePdf className="w-6 h-6 text-red-400" weight="bold" />;
    }
    return <FileText className="w-6 h-6" weight="bold" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <>
      <div 
        className="group relative w-10 h-10 bg-muted rounded border border-border flex-shrink-0 flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
        onClick={() => setIsEditing(true)}
        title={imprint.artwork ? `${imprint.artwork.filename} • ${imprint.colors} color${imprint.colors !== 1 ? 's' : ''} • ${imprint.width}" × ${imprint.height}"` : `${imprint.colors} color${imprint.colors !== 1 ? 's' : ''} • ${imprint.width}" × ${imprint.height}"`}
      >
        {mockups.length > 0 ? (
          <img src={mockups[0]} alt="Mockup" className="w-full h-full object-cover rounded" />
        ) : (
          <Image className="w-4 h-4 text-muted-foreground" weight="bold" />
        )}
        {imprint.artwork && (
          <div className="absolute -top-1 -right-1">
            {imprint.artwork.approved ? (
              <CheckCircle className="w-3 h-3 text-green-400 bg-background rounded-full" weight="fill" />
            ) : (
              <XCircle className="w-3 h-3 text-yellow-400 bg-background rounded-full" weight="fill" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
          <Pencil className="w-4 h-4 text-primary" weight="bold" />
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Imprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select 
                value={editedImprint.location} 
                onValueChange={(value) => setEditedImprint({...editedImprint, location: value as ImprintLocation})}
              >
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select 
                value={editedImprint.method} 
                onValueChange={(value) => setEditedImprint({...editedImprint, method: value as ImprintMethod})}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methodOptions.map(method => (
                    <SelectItem key={method} value={method}>{formatMethodLabel(method)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width (inches)</Label>
                <Input 
                  id="width"
                  type="number"
                  step="0.25"
                  value={editedImprint.width}
                  onChange={(e) => setEditedImprint({...editedImprint, width: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Height (inches)</Label>
                <Input 
                  id="height"
                  type="number"
                  step="0.25"
                  value={editedImprint.height}
                  onChange={(e) => setEditedImprint({...editedImprint, height: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="colors">Number of Colors</Label>
              <Input 
                id="colors"
                type="number"
                min="1"
                value={editedImprint.colors}
                onChange={(e) => setEditedImprint({...editedImprint, colors: parseInt(e.target.value) || 1})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="setup-fee">Setup Fee</Label>
              <Input 
                id="setup-fee"
                type="number"
                step="0.01"
                value={editedImprint.setup_fee}
                onChange={(e) => setEditedImprint({...editedImprint, setup_fee: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            <div className="space-y-3 pt-2 border-t border-border">
              <Label>Artwork Files</Label>
              
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <Upload className="w-8 h-8 text-muted-foreground" weight="bold" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop artwork files here or{' '}
                      <label className="text-primary hover:underline cursor-pointer">
                        browse
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.ai,.eps,.svg"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, PDF, AI, EPS, or SVG files
                    </p>
                  </div>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg group"
                      >
                        <div className="flex-shrink-0 text-muted-foreground">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" weight="bold" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {imprint.artwork && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Artwork</p>
                  <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                    <div className="flex-shrink-0">
                      {imprint.artwork.approved ? (
                        <CheckCircle className="w-5 h-5 text-green-400" weight="fill" />
                      ) : (
                        <XCircle className="w-5 h-5 text-yellow-400" weight="fill" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{imprint.artwork.filename}</p>
                      <p className="text-xs text-muted-foreground">
                      className="text-primary hover:underline text-xs"
                      </p>
                      {imprint.artwork.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">{imprint.artwork.notes}</p>
                      )}
                    </div>
                    <a
                      href={imprint.artwork.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
