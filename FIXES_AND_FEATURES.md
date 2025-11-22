# Fixes & Features Tracking

This document tracks all bugs fixed and new features added to HTML Studio Pro.

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

