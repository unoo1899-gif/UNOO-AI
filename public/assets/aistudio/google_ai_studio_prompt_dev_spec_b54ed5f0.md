# Google AI Studio Development Specification: Emo Book Service Sdn Bhd
**Website Direction:** Idea 1 — "Stock Guarantee & Rapid Reserve" Portal  
**Target Environment:** Google AI Studio (Single-file HTML + Tailwind CSS + Vanilla JS / Alpine.js + Lucide Icons)

---

## 1. Google AI Studio Master Prompt

Copy and paste the entire block below into Google AI Studio (e.g., using Gemini 1.5 Pro / Flash) to generate the complete website in a single, deployable `index.html` file:

```markdown
Act as a Principal Frontend Engineer and Senior UI/UX Designer.

Build a complete, production-ready, interactive single-page website for "Emo Book Service Sdn Bhd", a leading educational book distributor in Malaysia catering to international schools, parents, and students.

### Core Business Problem & Positioning
- Target Audience: Parents, students, and school coordinators.
- Audience Anxiety: Late shipments, start of school term without textbooks, and out-of-stock international editions.
- Solution: Verified 100% ready local warehouse stock with 24–48 hour dispatch guarantee.
- Conversion Goal: Drive users to submit the "Rapid Stock Inquiry & Pre-Order Form" or initiate an instant WhatsApp stock verification.

### Design System & Color Palette (Hex)
- Deep Crimson (Primary Brand / Headers / Navigation): #972828
- Terracotta Coral (Secondary Brand / Borders & Badges): #E45742
- Vibrant Orange (Primary CTA & Reserve Buttons): #EB7F31
- Warm Gold (Highlight / Ready Stock Pill Badges): #FCAD38
- Neutral Background: Warm off-white #FAFAF9
- Card Surfaces: #FFFFFF with subtle borders (#E7E5E4)

### Technical Constraints:
1. Deliver the entire website in ONE self-contained `index.html` file.
2. Use Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com"></script>`). Configure the custom palette in `tailwind.config`.
3. Include Lucide Icons via unpkg CDN (`<script src="https://unpkg.com/lucide@latest"></script>`).
4. Use clean, robust Vanilla JavaScript or Alpine.js for full interactivity.

### Required Functional Features:
1. **Top Urgency & Reassurance Banner:**
   - "⚡ Guaranteed Ready Local Stock in Malaysia • 24–48h Dispatch • Direct International School Syllabus Partner"
2. **Sticky Header:**
   - Emo Book Service brand logo with tagline.
   - Quick links (Curriculums, New Editions, Why Us, FAQs).
   - "Reserved Books" pill counter that shows count and opens the reserve drawer.
   - Direct "Urgent Stock Check" button.
3. **Hero Section:**
   - Headline: "Never Start the School Term Empty-Handed."
   - Subhead emphasizing zero arrival wait time and authentic new editions (Cambridge, IB, Edexcel).
   - **Interactive Quick-Search Bar:** Search input for Book Title/ISBN + School dropdown filter + "Check Live Stock" button.
   - Trust proof points: "45+ International Schools Supplied", "100% Ready Warehouse Stock", "Sub-2h WhatsApp Response".
4. **Interactive New Editions & Stock Catalog:**
   - Filter tabs: [All Curriculums, Cambridge IGCSE, IB Diploma, Pearson Edexcel, Primary & Checkpoint].
   - Provide at least 6 realistic sample book cards (e.g., Cambridge IGCSE Chemistry, IB DP Biology 2026 Edition, Edexcel Math Student Book, etc.).
   - Each card must display:
     * Cover mockup placeholder.
     * Syllabus Badge (e.g. "2026/2027 New Syllabus").
     * Title, Publisher, and ISBN.
     * **Stock Indicator:** Glowing green dot with "In Warehouse: Ready to Ship".
     * "Add to Reserve List" button that dynamically toggles to "Added ✓".
5. **Slide-Over / Floating "Reserve Drawer":**
   - Floating badge at the bottom-right showing total selected books.
   - Expands into a modal or drawer showing list of selected books with individual "Remove" triggers.
   - "Proceed to Inquiry" button which automatically scrolls to the Contact Form and auto-populates the book list.
6. **High-Converting Lead Capture Form:**
   - Role selector: Parent, Student, School Teacher/Coordinator.
   - Form fields: Full Name, WhatsApp Number (prefixed +60), Email, School Name, Needed-By Date, Urgency level checkbox.
   - Textarea for Book Titles / ISBNs (synced with the Reserve Drawer).
   - Submit Button: "Lock In Stock & Get Instant WhatsApp Quote".
   - Shows an instant success toast/modal upon submission with mock order summary and direct WhatsApp link.
7. **Reassurance "Why Choose Us" Grid & FAQ Accordion:**
   - Explains physical warehouse vs overseas shipping, authenticity guarantee, and express dispatch.
8. **Professional Footer:**
   - Company registration details: Emo Book Service Sdn Bhd.
   - Warehouse location (Selangor/Kuala Lumpur, Malaysia).
   - Direct WhatsApp helpline and operating hours.

Make the design visually rich, highly professional, responsive for mobile devices, and completely functional in a browser without any external build tools.
```

---

## 2. Technical Architecture for the AI Studio Output

### 2.1 Tailwind CDN Custom Palette Setup
Ensure the generated file configures the palette directly in the `<head>`:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            crimson: '#972828',
            coral: '#E45742',
            orange: '#EB7F31',
            gold: '#FCAD38',
            dark: '#1C1917',
            surface: '#FAFAF9'
          }
        }
      }
    }
  }
</script>
```

### 2.2 Mock Data Structure for Immediate Preview
The generated code should embed a JavaScript array of textbooks to allow live search and filtering right away:

```javascript
const sampleBooks = [
  {
    id: "ebs-01",
    title: "Cambridge IGCSE™ Chemistry Coursebook with Digital Access",
    edition: "5th Edition (Latest 2026-2028 Syllabus)",
    curriculum: "Cambridge IGCSE",
    isbn: "978-1108951609",
    publisher: "Cambridge University Press",
    stock: "42 copies in warehouse",
    dispatch: "Dispatches within 24h"
  },
  {
    id: "ebs-02",
    title: "IB Diploma Biology Course Companion 2026 Edition",
    edition: "New Specification Edition",
    curriculum: "IB Diploma",
    isbn: "978-0198423456",
    publisher: "Oxford University Press",
    stock: "28 copies in warehouse",
    dispatch: "Dispatches within 24h"
  },
  {
    id: "ebs-03",
    title: "Pearson Edexcel International GCSE (9-1) Mathematics A",
    edition: "Student Book 1 (With ActiveBook)",
    curriculum: "Pearson Edexcel",
    isbn: "978-0435183456",
    publisher: "Pearson Education",
    stock: "55 copies in warehouse",
    dispatch: "Same-day dispatch available"
  },
  {
    id: "ebs-04",
    title: "Cambridge Checkpoint Lower Secondary English Student's Book 8",
    edition: "3rd Edition",
    curriculum: "Primary & Checkpoint",
    isbn: "978-1398301234",
    publisher: "Hodder Education",
    stock: "19 copies in warehouse",
    dispatch: "Dispatches within 24h"
  }
];
```

---

## 3. Step-by-Step Instructions to Run in Google AI Studio

1. **Open Google AI Studio:**
   - Go to [aistudio.google.com](https://aistudio.google.com).
   - Create a new prompt and select **Gemini 1.5 Pro** or **Gemini 2.0 Flash**.
2. **Paste the Prompt:**
   - Copy Section 1 ("Google AI Studio Master Prompt") and paste it into the user prompt area.
   - Set the System Instructions (optional): *"You are an expert web designer and frontend developer. Always output complete, self-contained HTML files without truncating code."*
3. **Generate & Test:**
   - Click **Run**.
   - Copy the generated HTML code, save it locally as `index.html`, and double-click to test it in any web browser.
4. **Deploy for Free:**
   - Drag and drop your `index.html` into **Netlify Drop**, **Vercel**, or **GitHub Pages** to get a live URL for your customers.