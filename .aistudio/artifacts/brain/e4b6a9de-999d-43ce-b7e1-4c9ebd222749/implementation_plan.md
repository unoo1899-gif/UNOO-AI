# Emo Book Service Sdn Bhd - Stock Guarantee & Rapid Reserve Portal

A complete, production-ready, interactive single-page web application for Emo Book Service Sdn Bhd—Malaysia's premier educational book distributor catering to international schools, parents, and students.

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan outlines the architecture for the Emo Book Service platform, featuring real-time local warehouse stock tracking, instant book catalog filtering (Cambridge IGCSE, IB Diploma, Pearson Edexcel, Primary), interactive book reservation drawer, rapid stock inquiry & pre-order form with auto-populated items, and instant WhatsApp stock verification.

- **Confirmed Decision 1**: Implements a dedicated Top Urgency & Reassurance Banner highlighting 24-48h dispatch and guaranteed ready local stock in Malaysia.
- **Confirmed Decision 2**: Interactive Quick-Search bar with instant filtering by Book Title/ISBN and School Curriculum.
- **Confirmed Decision 3**: Slide-over "Reserve Drawer" and Lead Capture Form synced with instant WhatsApp quote generation and success confirmation.

---

## 1. Overview & Core Concept

- **What It Does**: Provides international school parents, students, and school coordinators with 100% verified local warehouse stock availability, elimination of overseas shipping wait times, interactive textbook search and reservation, and instant quote requests via WhatsApp or lead capture form.
- **Target Audience / Persona**: Parents buying school term books, students needing specific syllabus editions (Cambridge, IB, Edexcel), and school purchasing coordinators needing bulk readiness.
- **Key Value**: Eliminates start-of-term anxiety by ensuring verified physical warehouse availability in Selangor/KL with 24–48 hour express dispatch across Malaysia.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. Visitors land on the top urgency banner and sticky header with a live "Reserved Books" counter.
  2. Use the interactive Quick-Search Bar in the Hero section or browse category filter tabs in the New Editions & Stock Catalog.
  3. Click "Add to Reserve List" on textbook cards, instantly updating the floating reserve drawer badge.
  4. Open the Reserve Drawer to review selected books, adjust quantities or remove items, and click "Proceed to Inquiry".
  5. The page smoothly scrolls to the Lead Capture Form with selected books pre-populated in the notes textarea.
  6. Fill out role (Parent, Student, School Coordinator), contact info, needed-by date, and submit to trigger a success confirmation modal with direct WhatsApp pre-filled chat link and order summary.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Professional, trustworthy, educational publishing distributor aesthetic with warm off-white background (`#FAFAF9`), clean white cards (`#FFFFFF`), and subtle hairline borders (`#E7E5E4`).
  - *Color Palette & Tokens*:
    - Primary Brand / Headers: Deep Crimson (`#972828`)
    - Secondary Brand / Badges: Terracotta Coral (`#E45742`)
    - Primary CTA & Reserve Buttons: Vibrant Orange (`#EB7F31`)
    - Highlight / Stock Badges: Warm Gold (`#FCAD38`)
    - Neutral Background: Warm off-white (`#FAFAF9`)
  - *Typography*: Clean neo-grotesque display sans (`Plus Jakarta Sans` / `Outfit`) for bold headlines, and readable body sans with tabular numerals for ISBNs and stock counts.
  - *Component Styling*: Generous whitespace, single-elevation cards, zero pill spam, clean unboxed metadata with bullet separators (`·`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1**: Client-side state management for book reservation drawer and form auto-population.
  - *Chosen Approach*: React state (or robust Alpine/Vanilla JS) maintaining the selected books array, synchronized with local storage and contact form textarea.
  - *Why*: Instant feedback without page reloads, lightning-fast search and filter response times.
- **Decision 2**: Integration with WhatsApp API links for instant human verification.
  - *Chosen Approach*: Form submission and reserve actions construct a pre-formatted WhatsApp message (`https://wa.me/60...`) containing the user's name, school, role, needed-by date, and reserved book titles/ISBNs.
  - *Why*: Direct, high-conversion communication channel heavily preferred by Malaysian parents and school coordinators.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    index.html / App.tsx                     │
│  - Tailwind CSS + Custom Brand Palette                      │
│  - Lucide Icons & Google Fonts (Plus Jakarta Sans)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  Sticky Header & Top Banner  │              │    Hero & Quick Search Bar   │
│  - Reserve Counter Pill      │              │    - ISBN / Title Filter     │
│  - Navigation Links          │              │    - Curriculum Dropdown     │
└──────────────────────────────┘              └──────────────────────────────┘
                                                       │
                                                       ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│    Interactive Book Catalog  │              │      Slide-Over Drawer       │
│  - Filter Tabs by Curriculum │◄────────────►│  - Reserved Items List       │
│  - Stock Indicator Badges    │              │  - Steppers & Remove Actions │
│  - "Add to Reserve" Actions  │              │  - "Proceed to Inquiry" link │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               └───────────────────────┬─────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Lead Capture & Inquiry Form                  │
│  - Role Selector (Parent, Student, School Coordinator)      │
│  - Auto-Populated Book Titles & ISBNs Textarea             │
│  - Success Modal with Order Summary & Direct WhatsApp Link  │
└─────────────────────────────────────────────────────────────┘
```

- **Data Model**: Embedded structured array of authentic international school textbooks (Cambridge IGCSE, IB Diploma, Pearson Edexcel, Primary Checkpoint) with real ISBNs, publisher names, editions, warehouse stock counts, and dispatch guarantees.
- **Interactive Handlers**: Instant search filtering, category tab switching, reserve drawer toggle, quantity increment/decrement/removal, form validation, and WhatsApp link generation.
