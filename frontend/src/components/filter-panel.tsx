import { useState } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface FilterPanelProps {
  onFilterChange?: (filters: any) => void;
  filterType?: 'orders' | 'invoices';
}

export function FilterPanel({ onFilterChange, filterType = 'orders' }: FilterPanelProps) {
  const [filters, setFilters] = useState<any>({});

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    console.log('Filter changed:', key, value);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({});
              onFilterChange?.({});
            }}
            data-testid="button-clear-filters"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="date-from" className="text-xs">Date From</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            data-testid="input-date-from"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to" className="text-xs">Date To</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            data-testid="input-date-to"
          />
        </div>

        {filterType === 'orders' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Payment Status</Label>
              <Select value={filters.paymentStatus} onValueChange={(v) => handleFilterChange('paymentStatus', v)}>
                <SelectTrigger data-testid="select-payment-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Fulfillment Status</Label>
              <Select value={filters.fulfillmentStatus} onValueChange={(v) => handleFilterChange('fulfillmentStatus', v)}>
                <SelectTrigger data-testid="select-fulfillment-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Invoice Status</Label>
              <Select value={filters.invoiceStatus} onValueChange={(v) => handleFilterChange('invoiceStatus', v)}>
                <SelectTrigger data-testid="select-invoice-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="uninvoiced">Uninvoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {filterType === 'invoices' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Invoice Type</Label>
              <Select value={filters.invoiceType} onValueChange={(v) => handleFilterChange('invoiceType', v)}>
                <SelectTrigger data-testid="select-invoice-type">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                  <SelectItem value="bill_of_supply">Bill of Supply</SelectItem>
                  <SelectItem value="export_invoice">Export Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="gap-1">
                {value as string}
                <button onClick={() => clearFilter(key)} className="hover-elevate rounded-full">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
