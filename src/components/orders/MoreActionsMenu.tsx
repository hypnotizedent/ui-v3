import { useState, useRef, useEffect } from 'react';
import { DotsThree, Copy, Printer, EnvelopeSimple, PaperPlaneTilt, Archive, Trash, CircleNotch } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface MoreActionsMenuProps {
  onDuplicate?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onSendInvoice?: () => void;
  sendingInvoice?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function MoreActionsMenu({
  onDuplicate,
  onPrint,
  onEmail,
  onSendInvoice,
  sendingInvoice,
  onArchive,
  onDelete,
}: MoreActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    { icon: Copy, label: 'Duplicate Order', onClick: onDuplicate, danger: false, loading: false },
    { icon: Printer, label: 'Print Work Order', onClick: onPrint, danger: false, loading: false },
    { icon: EnvelopeSimple, label: 'Email Invoice', onClick: onEmail, danger: false, loading: false },
    { icon: PaperPlaneTilt, label: sendingInvoice ? 'Sending...' : 'Send Invoice', onClick: onSendInvoice, danger: false, loading: sendingInvoice },
    { icon: Archive, label: 'Archive', onClick: onArchive, danger: false, loading: false },
    { icon: Trash, label: 'Delete Order', onClick: onDelete, danger: true, loading: false },
  ].filter(item => item.onClick);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        className="h-8 w-8"
      >
        <DotsThree size={18} weight="bold" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-xl z-50 py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.loading) return;
                item.onClick?.();
                if (!item.loading) setOpen(false);
              }}
              disabled={item.loading}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                item.danger
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-muted'
              } ${item.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {item.loading ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <item.icon size={16} weight="duotone" />
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
