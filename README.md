# Startup Compass

Build a complete, production-quality web app based on the attached reference image.

PRODUCT:

A "Founder & Co-Builder Build-in-Public Hub" where startup founders share verified milestones and users/investors follow their startup journey.

CORE IDEA:

Founders create startup profiles and post verified progress such as MRR/revenue, DAU/MAU, users, product launches, ship logs, GitHub activity and other milestones. Integrations like Stripe and GitHub can verify data.

GOAL:

Make it feel like a real modern startup/product, not a college project or static UI.

TECH:

Use the existing project stack if one exists. Otherwise use Next.js + TypeScript + Tailwind CSS. Use a clean component-based architecture.

KEY PAGES:

- Landing page

- Explore/Discover startups

- Startup profile

- Founder profile

- Public milestone/timeline page

- Create/edit startup

- Create milestone/post

- Dashboard

- Analytics

- Login/signup

- Settings

- Notifications

LANDING PAGE:

Strong hero section, clear CTA, featured startups, latest milestones, how it works, verification/integrations, testimonials/social proof, and footer.

STARTUP PROFILE:

Logo, name, tagline, description, category, founders, website, verified badge, current MRR, users, growth, milestones, product updates, GitHub activity, timeline, followers and follow button.

DASHBOARD:

Overview metrics, growth charts, recent milestones, create-post button, startup management, followers, notifications and integration status.

MILESTONES:

Allow founders to publish updates with title, description, metric/value, date, category and optional image/link. Show them in a clean timeline. Include verified/unverified status.

INTEGRATIONS:

Create realistic UI for connecting Stripe and GitHub. If real API credentials are unavailable, use mock/demo data behind a clean integration architecture so it can easily be connected later. Clearly distinguish demo data from verified data.

DISCOVER:

Search, categories, filters, sorting, trending startups, recently updated startups and startup cards.

FUNCTIONALITY:

- Authentication UI

- Search/filtering

- Follow/unfollow startups

- Like/bookmark milestones

- Create/edit/delete milestones

- Create/edit startup profile

- Responsive navigation

- Notifications

- Forms with validation

- Loading, empty and error states

- Toasts/feedback

- Charts for growth metrics

- Responsive mobile/tablet/desktop layouts

- Real state management and working interactions

- Persistent data using the project's existing backend/database if available

DESIGN:

Premium modern SaaS/startup aesthetic.

Clean, minimal, polished and highly visual.

Use excellent typography, spacing, cards, subtle borders/shadows, tasteful gradients and micro-interactions.

Avoid generic AI-looking designs.

Use a consistent design system.

Make the dashboard and startup profiles especially impressive.

Dark/light mode if practical.

IMPORTANT:

Do NOT build only static screens.

Every important button, form, navigation item and interaction should work.

Reuse components instead of duplicating code.

Use realistic demo data so the app looks populated.

Don't invent unnecessary features that make the product confusing.

Keep the UX simple and intuitive.

QUALITY:

Before finishing, test the main user flows and fix broken links, console errors, responsiveness issues and visual inconsistencies.

If something cannot be fully connected because credentials/backend are missing, implement the complete frontend flow with a clean mock/service layer and clearly mark where real integration is needed.

Start by inspecting the existing project/files. Then build and improve the app directly.



## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
