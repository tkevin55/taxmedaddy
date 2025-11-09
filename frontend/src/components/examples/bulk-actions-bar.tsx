import { useState } from 'react';
import { BulkActionsBar } from '../bulk-actions-bar';
import { Button } from '@/components/ui/button';

export default function BulkActionsBarExample() {
  const [selectedCount, setSelectedCount] = useState(3);

  return (
    <div className="p-8 min-h-screen relative">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold">Bulk Actions Demo</h2>
        <p className="text-muted-foreground">
          The bulk actions bar appears at the bottom when items are selected.
        </p>
        <Button onClick={() => setSelectedCount(selectedCount > 0 ? 0 : 3)}>
          {selectedCount > 0 ? 'Deselect All' : 'Select 3 Items'}
        </Button>
      </div>

      <BulkActionsBar
        selectedCount={selectedCount}
        onClose={() => setSelectedCount(0)}
        onGenerateInvoices={() => console.log('Generate invoices for', selectedCount, 'items')}
        onExport={() => console.log('Export', selectedCount, 'items')}
        onSend={() => console.log('Send', selectedCount, 'items')}
      />
    </div>
  );
}
