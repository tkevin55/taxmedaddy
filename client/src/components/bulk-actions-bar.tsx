import { FileText, Download, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BulkActionsBarProps {
  selectedCount: number;
  onClose: () => void;
  onGenerateInvoices?: () => void;
  onExport?: () => void;
  onSend?: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClose,
  onGenerateInvoices,
  onExport,
  onSend,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <Card className="px-6 py-4 shadow-lg border-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="font-medium" data-testid="text-selected-count">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onGenerateInvoices && (
              <Button size="sm" onClick={onGenerateInvoices} data-testid="button-bulk-generate">
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoices
              </Button>
            )}
            {onExport && (
              <Button size="sm" variant="outline" onClick={onExport} data-testid="button-bulk-export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            {onSend && (
              <Button size="sm" variant="outline" onClick={onSend} data-testid="button-bulk-send">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={onClose} data-testid="button-close-bulk">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
