
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Image as ImageIcon, X } from '@phosphor-icons/react';
import type { Decoration, ProductType } from '@/lib/printshoppro-types';

interface ProductMockupWithSizeProps {
    productType: ProductType;
    color: string;
    decorations?: Decoration[];
    size?: 'small' | 'medium' | 'large';
    onMockupUpload?: (file: File) => void;
    className?: string;
}

export function ProductMockupWithSize({
    productType,
    color,
    decorations = [],
    size = 'medium',
    onMockupUpload,
    className = '',
}: ProductMockupWithSizeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    // Find the first decoration with a mockup
    const decorationWithMockup = decorations.find((d) => d.mockup);
    const mockupUrl = decorationWithMockup?.mockup?.dataUrl;

    const sizeClasses = {
        small: 'w-16 h-16',
        medium: 'w-24 h-24',
        large: 'w-32 h-32',
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onMockupUpload) {
            onMockupUpload(e.target.files[0]);
        }
    };

    return (
        <div
            className={`relative group ${sizeClasses[size]} ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="absolute inset-0 bg-secondary/20 rounded-lg border border-border overflow-hidden">
                {mockupUrl ? (
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                            <img
                                src={mockupUrl}
                                alt="Mockup"
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
                            <div className="relative">
                                <img
                                    src={mockupUrl}
                                    alt="Mockup Full"
                                    className="w-full h-auto rounded-lg shadow-2xl"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                    onClick={() => setPreviewOpen(false)}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                        {productType === 'tshirt' && (
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-2/3 h-2/3 opacity-20"
                            >
                                <path d="M12 2C8.69 2 6 4.69 6 8H2v2c0 .55.45 1 1 1h1l1.5 11h13L20 11h1c.55 0 1-.45 1-1V8h-4c0-3.31-2.69-6-6-6zm0 2c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z" />
                            </svg>
                        )}
                        {productType === 'hoodie' && (
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-2/3 h-2/3 opacity-20"
                            >
                                <path d="M12 2C8 2 6 5 6 5v3h12V5s-2-3-6-3zm0 2c1.5 0 2 1 2 1H10s.5-1 2-1zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v7h14v-7h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2H4z" />
                            </svg>
                        )}
                        {productType !== 'tshirt' && productType !== 'hoodie' && (
                            <ImageIcon className="w-1/2 h-1/2 opacity-20" />
                        )}
                    </div>
                )}
            </div>

            {/* Upload Overlay */}
            {onMockupUpload && (
                <div
                    className={`absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <label className="cursor-pointer p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <Camera size={size === 'small' ? 16 : 20} weight="fill" />
                    </label>
                </div>
            )}

            {/* Color Indicator */}
            {color && (
                <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                />
            )}
        </div>
    );
}
