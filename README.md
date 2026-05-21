# Bright Minds Academy

## Project Purpose
This project is a production quality static frontend foundation for Bright Minds Academy.
It establishes reusable architecture for premium tutoring pages, shared components, data driven rendering, SEO setup, accessibility defaults, and form handling foundations.

## Technology Stack
1. HTML5
2. CSS3
3. Vanilla JavaScript
4. Bootstrap 5
5. Bootstrap Icons
6. Local JSON data files

## Folder Structure
```text
bright-minds-academy/
  pages/
  components/
  assets/
    css/
    js/
    img/
    icons/
  data/
  design-tokens.css
  robots.txt
  sitemap.xml
  README.md
```

## How To Run Locally
This is a static frontend project and should be served from a local HTTP server.

Recommended options:
1. VS Code Live Server extension
2. Python HTTP server
3. Node based static server

### Python server example
```bash
cd bright-minds-academy
python -m http.server 5500
```
Then open:
```text
http://localhost:5500/pages/index.html
```

## Static Prototype Notes
1. This Step 1 implementation has no backend and no database
2. Data is loaded from local JSON files in the data folder
3. Dynamic rendering is foundation ready and can be expanded in later steps

## localStorage Lead Storage Notes
1. Lead storage key is versioned as bma_leads_v1
2. Data is saved only after storage consent is accepted
3. Parsing uses safe try catch fallback logic
4. No sensitive payment or protected data is stored

## API Migration Notes
All data read logic is centralized in assets/js/data-service.js.
To migrate to real APIs later, update this module without rewriting all pages.

## App Links
1. iOS: https://apps.apple.com/in/app/eskooly/id6448073356
2. Android: https://play.google.com/store/apps/details?id=com.eskooly.app&pcampaignid=web_share

## Contact Details
1. Phone: +91 72592 65766
2. WhatsApp: +91 72592 65766
3. Email: brightmindsforedu@gmail.com

## Configurable Domain Note
robots.txt and sitemap.xml currently use the placeholder production domain https://brightmindsacademy.vercel.app.
Replace this value with your real production domain before deployment.

## Development Step Status
1. Step 1: Complete
2. Step 2: Pending
3. Step 3: Pending
4. Step 4: Pending
5. Step 5: Pending
6. Step 6: Pending
7. Step 7: Pending

## Step 1 QA Checklist
1. All required folders and files exist
2. All 15 pages have valid HTML5 structure
3. Bootstrap, fonts, and global assets are linked
4. Skip link and main landmark are present on each page
5. Component mount points exist on every page
6. Data service can fetch all local JSON files
7. Reusable component partials are available
8. Form validation and localStorage foundations are implemented
9. SEO files robots.txt and sitemap.xml are present
10. README documentation is complete

## Accessibility Notes
1. Semantic landmarks and heading hierarchy are included
2. Skip to content navigation is present on all pages
3. Form inputs include visible labels
4. Toast and consent components include accessible roles and live regions
5. Focus ring styling is consistent through design tokens
6. Reduced motion support is included in CSS and animation scripts

## Performance Notes
1. Shared components and data responses use basic caching
2. CSS architecture is split by concern for maintainability
3. Animation logic uses IntersectionObserver and avoids heavy libraries
4. Local static assets allow fast prototype loading
