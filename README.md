# Loay M. Ismael — Portfolio Website

Personal portfolio focused on healthcare data analysis, health informatics, and a long-term interest in AI in Medicine.

## Current features

- Responsive portfolio landing page with professional profile, services, experience, education, skills, and contact details.
- Three dedicated healthcare analytics project case studies:
  - Hospital Emergency Room Dashboard
  - Medical Appointment No-Shows Analysis
  - Hospital Readmission Analytics
- Project case studies structured around the business problem, approach, key findings, recommendations, impact, clinical relevance, tools, and lessons learned.
- Light/dark theme toggle, mobile navigation, project category filters, reduced-motion support, and toast notifications.
- Dedicated Visitors page showing aggregate visit totals and country-level counts. Individual visit records and coordinates are not displayed on the public dashboard.
- Privacy Policy and Terms of Use.
- Static HTML, CSS, and JavaScript; no build step is required.

## Visitor analytics and privacy

The site uses a Cloudflare Worker and Cloudflare D1 database for custom visitor analytics. Depending on the request and available geolocation information, the analytics system may store a visitor identifier, country, city, approximate coordinates, page path, and visit timestamp. The public `/stats` endpoint and Visitors page are designed to return aggregate totals and country counts only.

The public repository contains the Worker source and database schema under `cloudflare/`. Runtime secrets must be configured in Cloudflare and must never be committed to this repository. Review the [Privacy Policy](https://loaymismael.github.io/privacy.html) for further details.

## Contact form limitation

The contact form currently prepares an email draft in the visitor's email application. It does not send a message through this website or store contact submissions in a website database.

## Publish with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch `main` and folder `/(root)`, then save.
4. Wait for GitHub Pages to finish publishing at https://loaymismael.github.io.

## Security notes

Do not add API keys, OAuth secrets, owner bypass tokens, or service-role keys to this public repository. Backend secrets belong in the hosting provider's secret configuration. Any future backend feature should use server-side secrets, verified authorization, abuse protection, and confirmed free-tier limits.

## Links

- Portfolio: https://loaymismael.github.io
- Visitors: https://loaymismael.github.io/visitors.html
- Privacy Policy: https://loaymismael.github.io/privacy.html
- GitHub: https://github.com/loaymismael
- LinkedIn: https://www.linkedin.com/in/loaymismael/
- ORCID: https://orcid.org/0009-0000-9387-5831
- Email: loaymohamed165@gmail.com
