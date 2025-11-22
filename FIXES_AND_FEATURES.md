# Fixes & Features Tracking

This document tracks all bugs fixed and new features added to HTML Studio Pro.

---

## ✨ New Features

### **Google Doc Image Info Import** _(Added: Nov 22, 2025)_

**Feature:**  
Users can now import image metadata (alt text, titles, filenames) directly from their Google Doc content by pasting it into a modal. The system intelligently parses the content and automatically applies the metadata to uploaded photos.

**How It Works:**
1. User clicks "Import Image Info from Google Doc" button below the Google Doc Link field
2. A modal opens with a large textarea
3. User pastes the raw Google Doc content (including image blocks)
4. Click "Parse Content" to extract image metadata
5. Preview shows all found images with their metadata
6. Click "Apply to Images" to automatically:
   - Auto-select the first image as the featured image
   - Match remaining images by filename and HTML src numbers
   - Apply alt text and titles to all matched photos

**Google Doc Format:**
```
IMAGE URL
great-exterior-remodeling-contractors-spofford-nh-jancewicz-and-son.jpg

IMAGE FILE NAME
great-exterior-remodeling-contractors-spofford-nh-jancewicz-and-son

IMAGE (SEARCH) TITLE
Great Exterior Remodeling Contractors In Spofford, NH | Jancewicz & Son

IMAGE ALT TEXT
A new black front door with sidelights installed on a New Hampshire house.
```

**Smart Matching Logic:**
- **Featured Image**: First parsed image (Image 1) is auto-selected as featured image
- **HTML Integration**: Second parsed image (Image 2) matches HTML `src="1"`, third matches `src="2"`, etc.
- **Filename Matching**: System tries to match parsed filenames with actual uploaded photo filenames
- **Order Fallback**: If filename match fails, uses sequential order
- **Two-Source Confirmation**: Uses both HTML editor src numbers AND Google Doc order for accurate matching

**Example Workflow:**
```
Google Doc Content:          HTML Editor:             Result:
Image 1 (Featured)    →      [not in HTML]      →    Auto-selected as featured
Image 2               →      <img src="1">      →    Applied to photo-1.jpg
Image 3               →      <img src="2">      →    Applied to photo-2.jpg
Image 4               →      <img src="3">      →    Applied to photo-3.jpg
```

**Benefits:**
- Saves time by bulk-importing image metadata instead of manual entry
- Reduces errors by matching filenames automatically
- Integrates with existing HTML src numbering system
- Auto-selects featured image for faster workflow

**Files Created:**
- `src/utils/googleDocParser.ts` - Parses Google Doc content to extract image metadata
- `src/utils/imageMatching.ts` - Smart matching algorithm for images
- `src/components/html-builder/GoogleDocImportModal.tsx` - Modal UI component

**Files Modified:**
- `src/types/index.ts` - Added `alt` and `title` fields to `TaskImage` interface
- `src/components/html-builder/CompanySection.tsx` - Added import button below Google Doc Link
- `src/pages/HtmlBuilder.tsx` - Added handler function and modal integration

---

## 🐛 Bug Fixes

### **Image URL Copy Buttons - All Turning Purple Bug** _(Fixed: Nov 22, 2025)_

**Problem:**  
When viewing the images tab (opened in new tab or images-only mode), clicking the copy button for ONE image's full URL would turn ALL image copy buttons purple instead of just the clicked one.

**Before:**
```
Images Tab - Full URLs displayed:
- Image 1: https://...image1.webp [Copy]
- Image 2: https://...image2.webp [Copy]
- Image 3: https://...image3.webp [Copy]

Click "Copy" on Image 1 → ALL 3 buttons turn purple 🟣
```

**After:**
```
Images Tab - Full URLs displayed:
- Image 1: https://...image1.webp [Copy] 🟣 1
- Image 2: https://...image2.webp [Copy] (gray)
- Image 3: https://...image3.webp [Copy] (gray)

Click "Copy" on Image 1 → Only Image 1 turns purple 🟣 1
Click "Copy" on Image 3 → Only Image 3 turns purple 🟣 2
```

**Root Cause:**  
All image URL copy buttons shared the same button ID (`'fullUrl'`), causing them to share tracking state.

**Solution:**  
Each image URL copy button now has a unique ID based on its index (`fullUrl-${index}`), giving each button independent tracking.

**Files Modified:**
- `src/pages/HtmlBuilder.tsx` - Updated image URL copy buttons to use unique IDs per image (line 1370-1372)

---

### **Leading Space in Input Fields** _(Fixed: Nov 22, 2025)_

**Problem:**  
When pasting text into input fields (e.g., Meta Title, Instructions to Link, Maps Location), an extra space would appear at the beginning of the text.

**Before:**
```
User pastes: "Boston, MA"
Field shows: " Boston, MA"  // unwanted leading space
```

**After:**
```
User pastes: "Boston, MA"
Field shows: "Boston, MA"  // no leading space
```

**Solution:**  
Added `.trimStart()` to input onChange handlers to automatically remove leading spaces while preserving trailing spaces and internal spacing.

**Files Modified:**
- `src/pages/HtmlBuilder.tsx`
  - `handleMapsLocationChange()` - Line 359
  - `handleTextChange()` - Line 426 (instructionsToLink case)

**Implementation:**
```typescript
const handleMapsLocationChange = (value: string) => {
  const trimmedValue = value.trimStart(); // Remove leading spaces only
  setMapsLocation(trimmedValue);
  if (currentTask) {
    updateTask(currentTask.id, { mapsLocation: trimmedValue });
  }
};
```

---

### **Duplicate "ocboston" Company Auto-Creation** _(Fixed: Nov 22, 2025)_

**Problem:**  
A hardcoded default company "ocboston" was automatically re-created every time the companies list became empty. User wanted to keep only "OcBoston(Lux)" but the duplicate kept reappearing after deletion.

**Before:**
1. User deletes "ocboston" company
2. App detects empty companies list
3. Auto-creates "ocboston" from DEFAULT_COMPANY constant
4. Duplicate reappears

**After:**
1. User deletes "ocboston" company
2. It stays deleted
3. No auto-creation of companies

**Solution:**  
Removed the DEFAULT_COMPANY constant and auto-creation logic from the `fetchCompanies()` function in TaskContext.

**Files Modified:**
- `src/context/TaskContext.tsx`
  - Removed `DEFAULT_COMPANY` constant (was line 76-82)
  - Removed auto-creation logic from `fetchCompanies()` (was line 136-145)

**Implementation:**
```typescript
// Before:
const fetchCompanies = async () => {
  if (!isAuthorized) return;
  try {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    const companiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    
    if (companiesList.length === 0) {
      await addDoc(collection(db, 'companies'), DEFAULT_COMPANY); // ❌ Auto-creates default
      // ...
    }
  }
};

// After:
const fetchCompanies = async () => {
  if (!isAuthorized) return;
  try {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    const companiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    setCompanies(companiesList); // ✅ Just sets what exists, no auto-creation
  }
};
```

---

### **Maps Label Styling Inconsistency** _(Fixed: Nov 22, 2025)_

**Problem:**  
The "Enter a City, ST:" label in the Maps section had inconsistent styling compared to other labels like "Contact Us Link".

**Before:**
```tsx
<label className="text-sm mb-1">Enter a City, ST:</label>
```

**After:**
```tsx
<label className="text-sm font-medium mb-1 block">Enter a City, ST:</label>
```

**Solution:**  
Added `font-medium` and `block` classes to match the styling of other form labels.

**Files Modified:**
- `src/pages/HtmlBuilder.tsx` - Line 1782

---

## ✨ New Features

### **Smart Blog Template Selection** _(Added: Nov 22, 2025)_

**Description:**  
Blog posts now intelligently choose templates based on whether the selected company has custom blog templates.

**Use Case:**  
Previously, when creating a blog post, ALL blog templates from all companies (including generic/universal templates) would show up. This was cluttered and made it hard to find company-specific templates. Now:
- If a company has its own blog templates → show ONLY those
- If a company has NO blog templates → fall back to generic/universal templates

**Behavior:**

*Before:*
- Company: "OcBoston(Lux)"
- Page Type: Blog
- Templates shown: Generic Template 1, Generic Template 2, OcBoston Template A, OcBoston Template B (all mixed together)

*After:*
- Company: "OcBoston(Lux)" (has custom templates)
- Page Type: Blog  
- Templates shown: OcBoston Template A, OcBoston Template B (only company-specific ones)

*Fallback:*
- Company: "NewCompany" (no custom templates)
- Page Type: Blog
- Templates shown: Generic Template 1, Generic Template 2 (universal templates as fallback)

**Implementation:**  
Updated template filtering logic to check if the selected company has blog templates first. Only shows generic templates when company has none.

**Files Modified:**
- `src/components/html-builder/CompanyTemplateSection.tsx` - Lines 25-47 (template filtering logic)
- `src/pages/HtmlBuilder.tsx` - Lines 771-806 (auto-apply template logic)

---

### **Copy Button Click Tracking with Auto-Checkbox** _(Added: Nov 22, 2025)_

**Description:**  
All copy buttons and the Download All button in the HTML Builder now show visual feedback when clicked, displaying a purple background with a sequential number (copy buttons only) to track the order in which fields were copied. When all copy buttons in a section are clicked, the section's checkbox automatically turns green. Clicking again resets the button.

**Use Case:**  
When working with multiple fields (Featured Title, Meta Title, Tags, Contact Link, Download All, etc.), users needed a way to track which fields they've already copied and in what order. This prevents accidentally missing fields or copying the same field twice. Auto-checking section checkboxes provides a visual confirmation that all required fields in that section are complete.

**Behavior:**

*Default State:*
- Copy buttons: Gray background with copy icon
- Download All: Green background
- Section checkboxes: Unchecked (gray)

*After Clicking Copy Buttons:*
- Copy buttons: Background turns **purple** 🟣 with sequential number (1, 2, 3, etc.)
- Download All: Background turns **purple** 🟣 (no number, just color change)
- Stays purple (local session only)

*Auto-Checkbox Behavior:*
When ALL copy buttons in a section are clicked, the section checkbox automatically turns green ✅

**Section Mappings:**
1. **Featured Image** → Requires: `Featured Title` + `Featured Alt` copy buttons
2. **Meta Info and Title** → Requires: `Widget Title` + `Meta Title` + `Meta URL` + `Meta Description` copy buttons
3. **Google Maps Embed** → Requires: `Maps Embed Code` copy button
4. **Photos Downloaded** → Requires: `Download All` button

*Click to Reset:*
- Clicking a purple button removes the tracking
- Returns to default state
- If this causes a section to be incomplete, checkbox auto-unchecks
- Allows re-clicking later to get a new number/mark

*Example Workflow:*
1. Click "Featured Title" copy → turns purple 🟣 "**1**"
2. Click "Featured Alt" copy → turns purple 🟣 "**2**"
3. ✅ **Auto-check:** "Applied Featured Image" checkbox turns green
4. Click "Featured Title" again (reset) → back to gray
5. ❌ **Auto-uncheck:** "Applied Featured Image" checkbox turns gray (incomplete section)
6. Click "Featured Title" again → turns purple 🟣 "**3**"
7. ✅ **Auto-check:** "Applied Featured Image" checkbox turns green again

**Implementation:**  
- Local state tracking in HtmlBuilder component
- Each copy button has unique ID with numbered display
- Download All button shows only color change (no number)
- useEffect monitors copy button state and auto-toggles checkboxes
- Counter increments only on first click per button
- Clicking again removes the tracking (reset)
- Visual state persists throughout session but resets on page refresh

**Files Modified:**
- `src/components/ui/CopyButton.tsx` - Added clickOrder prop, purple color, number display, and reset functionality
- `src/pages/HtmlBuilder.tsx` - Added copy tracking state, handlers, auto-checkbox logic, and applied to all copy buttons + Download All button (color only)

---

### **Larger Image Thumbnails in URL List** _(Added: Nov 22, 2025)_

**Description:**  
Significantly increased the size of image thumbnails in the Images tab URL list (top section) for better visibility and easier image identification.

**Use Case:**  
The original 64×64px thumbnails were too small to distinguish between different images, especially for detailed photos like roof inspections. Users need to see clear previews to select the correct image URL.

**Changes:**

*Before:*
- Thumbnail size: 64px × 64px (w-16 h-16)
- Difficult to see image details
- No click interaction

*After:*
- Thumbnail size: 128px × 128px (mobile) to 160px × 160px (desktop)
- 2.5x larger for clear visibility
- Click to view full size in new tab
- Better hover effects and border styling

**Visual Impact:**
- Much easier to identify specific images
- Click thumbnail to view full resolution
- Professional presentation with better spacing
- Bottom gallery section unchanged (remains compact)

**Files Modified:**
- `src/pages/HtmlBuilder.tsx` - Increased thumbnail size in URL list from 64px to 128-160px, added click-to-view functionality

---

### **Auto-Sort Images by HTML Order** _(Added: Nov 22, 2025)_

**Description:**  
Images in the Images & Converter tab can be automatically reorganized to match the order they appear in the HTML editor code. A toggle button lets users switch between HTML order and upload order. Featured image is labeled with a badge and placed at the bottom when sorting is enabled.

**Use Case:**  
When working with blog posts or landing pages, users paste HTML code with multiple `<img>` tags that have alt text. The uploaded images need to be inserted in the correct order matching the HTML. Previously, images were only shown in upload order, making it difficult to match them with the HTML code. Now users can toggle sorting to match HTML order, making it easy to copy the correct image URL for each tag.

**How It Works:**

*Toggle Button:*
- Orange "✓ Sorted by HTML" = Images are sorted by HTML order
- Gray "Sort by HTML" = Images in upload order
- Click to toggle between modes

*Featured Image Treatment:*
- Featured image is labeled with "⭐ Featured Image" green badge
- Featured image has green border for easy identification
- When sorting is enabled, featured image always appears at the bottom
- This keeps featured image separate from body content images

*Matching Process:*
1. System extracts all `<img>` tags from HTML editor in order
2. Gets the `alt` attribute from each img tag
3. Normalizes alt text and image filenames (lowercase, remove special chars)
4. Matches alt text with uploaded image filenames
5. Reorders images to match HTML order
6. Places featured image at the bottom

*Example:*
```html
HTML Code:
<img src="" alt="amazing-roof-cleaning">
<img src="" alt="great-roof-cleaning">
<img src="" alt="professional-roof-cleaning">

Uploaded Images:
- professional-roof-cleaning-seabrook-tx.jpeg
- amazing-roof-cleaning-seabrook-tx.jpeg  
- great-roof-cleaning-seabrook-tx.jpeg
- hero-image-featured.jpeg (marked as featured)

Click "Sort by HTML" Button:

Images Tab Display (Sorted):
1. amazing-roof-cleaning-seabrook-tx.jpeg     [Copy URL]
2. great-roof-cleaning-seabrook-tx.jpeg       [Copy URL]
3. professional-roof-cleaning-seabrook-tx.jpeg [Copy URL]
4. ⭐ Featured Image: hero-image-featured.jpeg  [Copy URL]
```

**Behavior:**
- Toggle control: Orange button shows sorting is active, gray shows upload order
- Default: Sorting enabled when opening Images tab
- Smart matching: Alt text "roof-cleaning" matches "amazing-roof-cleaning-tx-brinkmann.jpeg"
- Unmatched images: Images without matching alt text appear after matched images
- Featured always last: Featured image always at bottom when sorted
- Only in Images tab: Sorting only applies to the separate Images & Converter page

**Implementation:**  
- Created `sortImagesByHtmlOrder()` utility function that parses HTML and matches images by alt attributes
- Integrated sorting into HtmlBuilder component with toggle button
- Added visual indicator (orange vs gray) to show sort state
- Added featured image detection and labeling

**Files Modified:**
- `src/utils/imageSorting.ts` - Image sorting utility with HTML parsing, matching logic, and featured image handling
- `src/pages/HtmlBuilder.tsx` - Added toggle button, conditional sorting logic, and featured image badge

---

### **Featured Image Modal Selector** _(Added: Nov 22, 2025)_

**Description:**  
Replaced small dropdown menu for featured image selection with a large modal popup showing bigger image thumbnails in a grid layout. Makes it much easier to identify and select the correct featured image.

**Use Case:**  
Previously, the featured image selector was a narrow dropdown showing only image filenames. Users had difficulty identifying which image to select, especially when multiple images had similar names. The new modal shows large thumbnails (192px tall) in a grid, making visual identification easy.

**How It Works:**

*Modal Features:*
- Click "Select image" button → Opens full-screen modal
- Grid layout: 2 columns on mobile, 3 on desktop
- Large thumbnails: 192px height for clear visibility
- Hover effects: Images scale up slightly on hover
- Selected indicator: Green border + checkmark badge on selected image
- Filename overlay: Image name shown at bottom of each thumbnail
- Click any image → Selects it and closes modal

*Visual Feedback:*
```
Before (dropdown):
┌─────────────────┐
│ Select image ▼  │
└─────────────────┘
  │ image-name-1.jpeg
  │ image-name-2.jpeg
  │ image-name-3.jpeg
  └─ (text only, hard to identify)

After (modal):
┌─────────────────────────────────────┐
│  Select Featured Image         [×]  │
├─────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │  IMG1  │  │  IMG2  │  │  IMG3 ✓││ (large previews)
│  │192px h │  │192px h │  │192px h ││
│  └────────┘  └────────┘  └────────┘│
└─────────────────────────────────────┘
```

**Behavior:**
- Button icon changed from ▼ to 🖼️ to indicate image selection
- Modal scrollable for many images
- Selected image shows green ring and checkmark
- Clicking outside modal closes it without changing selection

**Implementation:**  
- Replaced dropdown with Dialog component
- Added grid layout with responsive columns
- Increased thumbnail size from small icon to 192px height
- Added visual selection indicators

**Files Modified:**
- `src/pages/HtmlBuilder.tsx` - Replaced featured image dropdown with modal selector, added grid layout with larger thumbnails

---

### **Image Number-Based Sorting** _(Added: Nov 22, 2025)_

**Description:**  
Images in the Images & Converter tab can now be sorted based on numbered img src attributes in the HTML code. Users manually number their img src (e.g., `src="1"`, `src="2"`, `src="3"`), and the system automatically reorders images to match those numbers when "Sort by HTML" is enabled.

**Use Case:**  
When building HTML content, users paste code with img tags but need to match them with uploaded images. By manually numbering the img src attributes (replacing long URLs with simple numbers), users can easily see which image corresponds to which position in their HTML. The Images tab then shows a numbered badge next to each image for quick identification.

**How It Works:**

*User Workflow:*
1. Paste HTML code with img tags
2. Manually change img src from URLs to numbers:
   ```html
   Before:
   <img src="https://long-url.com/image.jpg" alt="text">
   
   After:
   <img src="1" alt="text">
   <img src="2" alt="text">
   <img src="3" alt="text">
   ```
3. Open Images & Converter tab
4. Click "✓ Sorted by HTML" (orange button)
5. Images reorder to match numbered src
6. Each image shows a blue badge with its number (e.g., "#1", "#2")

*Matching Logic:*
- System extracts img src numbers from HTML (e.g., src="1", src="2")
- Maps numbers to uploaded images by upload order
- Image 1 = first uploaded image, Image 2 = second, etc.
- Featured image always appears at bottom with "Featured Image" label
- Non-featured images show "#N" badge when sorted

*Example:*
```
HTML Code (user manually numbered):
<img src="1" alt="roof-cleaning">
<img src="2" alt="gutter-cleaning">
<img src="3" alt="pressure-washing">

Uploaded Images (in upload order):
1. amazing-roof-tx.jpeg
2. gutter-clean-tx.jpeg  
3. pressure-wash-tx.jpeg
4. hero-featured.jpeg (marked as featured)

Images Tab Display (Sorted):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#1  amazing-roof-tx.jpeg         [Copy URL]
#2  gutter-clean-tx.jpeg         [Copy URL]
#3  pressure-wash-tx.jpeg        [Copy URL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    hero-featured.jpeg           [Copy URL]
    Featured Image
```

**Visual Elements:**
- **Blue badge "#N"**: Shows image number when sorting is active
- **Green badge "Featured Image"**: Labels the featured image
- **Green border + star badge**: Highlights featured image
- **Featured at bottom**: Separated from body content images

**Fallback Behavior:**
- If no numbered src found, falls back to alt text matching (previous method)
- If sorting is disabled (gray button), shows images in upload order
- Numbers only appear when "Sort by HTML" is enabled

**Implementation:**  
- Created `imageNumbering.ts` utility to extract img src numbers from HTML
- Updated `imageSorting.ts` to use number-based ordering with fallback to alt text
- Added number badge display in HtmlBuilder component
- Featured image always positioned at bottom when sorted

**Files Modified:**
- `src/utils/imageNumbering.ts` (new) - Extracts numbered img src from HTML
- `src/utils/imageSorting.ts` - Updated to use number-based ordering, added featured image handling
- `src/pages/HtmlBuilder.tsx` - Added number badge display, featured image label, and sorting integration

---

### [Document New Features Here]

_Add new entries below as features are implemented._

**Template:**
```markdown
### **Feature Name** _(Added: Date)_

**Description:**  
Brief description of what the feature does.

**Use Case:**  
Why this feature was needed.

**Implementation:**  
Key technical details.

**Files Modified:**
- List of files changed
```

---

## 📝 Notes

- This document should be updated whenever a bug is fixed or feature is added
- Include date, problem/solution description, and files modified
- Use clear before/after examples when applicable
- Keep code snippets concise but informative

---

**Last Updated:** November 22, 2025

