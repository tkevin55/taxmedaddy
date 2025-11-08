import { FilterPanel } from '../filter-panel';

export default function FilterPanelExample() {
  return (
    <div className="p-8 max-w-sm">
      <FilterPanel
        filterType="orders"
        onFilterChange={(filters) => console.log('Filters changed:', filters)}
      />
    </div>
  );
}
