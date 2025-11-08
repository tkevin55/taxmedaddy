# Design Guidelines: GST Invoicing SaaS Application

## Design Approach

**Selected Approach:** Design System-Based with Modern SaaS Patterns

**Justification:** This is a data-intensive, enterprise-grade productivity tool requiring clarity, efficiency, and learnability. Drawing inspiration from Linear's clean dashboard aesthetics, Stripe's data-dense layouts, and Material Design's information hierarchy.

**Core Principles:**
- Information clarity over decoration
- Scannable data density
- Consistent, predictable patterns
- Professional, trustworthy appearance

---

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - UI elements, body text, data tables
- Mono: JetBrains Mono - invoice numbers, GST numbers, numerical data

**Hierarchy:**
- Page Titles: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Card/Panel Titles: text-base font-medium
- Body Text: text-sm font-normal
- Helper/Meta Text: text-xs
- Table Headers: text-xs font-medium uppercase tracking-wide
- Data/Numbers: text-sm font-mono

---

## Layout System

**Spacing Units:** Use Tailwind units of **2, 4, 6, 8, 12, 16** (p-2, gap-4, mb-6, py-8, space-y-12, mt-16)

**Grid Structure:**
- App Shell: Fixed sidebar (w-64) + main content area
- Content Max Width: max-w-7xl mx-auto
- Card Spacing: gap-6 for card grids
- Form Layouts: max-w-2xl for single-column forms
- Invoice Editor: 60/40 split (form left, preview right) on desktop

**Container Strategy:**
- Dashboard: Full-width with px-6 py-8
- Data Tables: Full container width
- Forms: Centered with max-width constraints
- Modals: max-w-2xl to max-w-4xl based on complexity

---

## Component Library

### Navigation
**Sidebar (Primary):**
- Fixed left, full height
- Width: w-64
- Sections: Logo (h-16), Navigation Links (space-y-1), User Profile (bottom)
- Active state: Subtle background treatment
- Icons: Heroicons outline (w-5 h-5), filled when active

**Top Bar:**
- Fixed top, h-16
- Right side: Search (w-64), notifications, user dropdown
- Breadcrumbs on larger views

### Data Display
**Tables:**
- Alternating row treatment for scannability
- Fixed header on scroll
- Row height: py-4
- Cell padding: px-6
- Sticky first column for key identifiers (invoice #, order #)
- Action column: right-aligned with icon buttons
- Pagination: Bottom-right, showing "X-Y of Z results"

**Cards:**
- Rounded: rounded-lg
- Padding: p-6
- Shadow: Subtle elevation
- Stat Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4, gap-6

**Invoice Preview:**
- A4 aspect ratio container (210:297)
- Bordered with shadow
- Scale to fit viewport
- Zoom controls for detailed review

### Forms & Inputs
**Input Fields:**
- Height: h-10 for text inputs
- Padding: px-4
- Rounded: rounded-md
- Labels: text-sm font-medium mb-2
- Help text: text-xs below field, mt-1
- Error states: Border treatment + error message

**Select Dropdowns:**
- Match input height (h-10)
- Custom dropdown with search for long lists (GST states, HSN codes)

**Form Sections:**
- Group related fields with section dividers
- Section spacing: space-y-6
- Field spacing within section: space-y-4

**Multi-Step Forms (Onboarding):**
- Progress indicator: Top of form
- Step navigation: Clear back/next buttons
- Current step highlighted

### Buttons & Actions
**Primary Action:** Solid fill, h-10, px-6, rounded-md, font-medium
**Secondary Action:** Border treatment, same dimensions
**Tertiary/Text:** No background, underline on hover
**Icon Buttons:** w-8 h-8, rounded-md
**Bulk Actions Bar:** Fixed bottom when items selected, showing count + actions

### Filters & Search
**Filter Panel:**
- Collapsible sidebar or top panel
- Filter groups with clear labels
- Applied filters: Chip/badge display with × to remove
- "Clear all" option when filters active

**Search:**
- Prominent placement (top bar or page header)
- Prefix icon (magnifying glass)
- Placeholder text indicating searchable fields
- Show results count

### Modals & Overlays
**Modal Sizes:**
- Small: max-w-md (confirmations)
- Medium: max-w-2xl (forms)
- Large: max-w-4xl (invoice editor)

**Structure:**
- Header: Title + close button (h-16, px-6)
- Content: px-6 py-4, scrollable if needed
- Footer: Actions right-aligned, px-6 py-4, border-top

**Toasts/Notifications:**
- Top-right positioning
- Auto-dismiss (5s) or manual close
- Types: Success, error, warning, info
- Include icon + message + optional action

---

## Page-Specific Layouts

### Dashboard
**Structure:**
- Stat cards row (4 columns): Today's invoices, uninvoiced orders, pending amount, total GST collected
- Two-column section below: Recent invoices (left 60%), GST summary chart (right 40%)
- Quick actions: Prominent CTAs for common tasks

### Orders View
**Layout:**
- Filter sidebar (left, w-64, collapsible)
- Main content: Table with columns: Order #, Date, Customer, Amount, Status, Invoice Status, Actions
- Bulk actions bar appears when rows selected
- Top right: Sync button, date range picker

### Invoice Creation/Edit
**Split View:**
- Left pane (40%): Form with sections - Buyer Details, Line Items, Tax Settings, Notes
- Right pane (60%): Live invoice preview
- Sticky header with: Invoice type, Save/Cancel, More actions dropdown

### Settings
**Tab Navigation:**
- Horizontal tabs for major sections
- Vertical sub-navigation within complex sections
- Each section in card containers with clear headings

---

## Responsive Behavior

**Breakpoints:**
- Mobile (< 768px): Single column, hamburger menu, stacked forms
- Tablet (768-1024px): Sidebar collapses to icons only
- Desktop (> 1024px): Full layout

**Mobile Optimizations:**
- Tables: Horizontal scroll or card view transformation
- Multi-column forms: Stack to single column
- Invoice preview: Full-screen modal on mobile

---

## Icons

**Library:** Heroicons (CDN)
**Usage:**
- Navigation: outline style, w-5 h-5
- Buttons: w-4 h-4 inline with text
- Status indicators: w-4 h-4, colored
- Empty states: w-16 h-16, muted

---

## Images

**No hero images** - This is a B2B SaaS application, not a marketing site.

**Image Usage:**
- Company logos: Max 200x80px in invoice headers
- Empty states: Simple illustrations (can use Undraw or similar)
- User avatars: Circular, w-8 h-8 to w-10 h-10

---

## Accessibility

- Form labels always visible, properly associated
- Focus states clearly visible on all interactive elements
- Keyboard navigation throughout application
- ARIA labels for icon-only buttons
- Sufficient contrast for all text (WCAG AA minimum)
- Loading states announced to screen readers