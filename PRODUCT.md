# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Prospective tattoo clients evaluating Nico Tatuaggi's work before booking — primarily reached via Instagram/WhatsApp and browsing **mostly on mobile** (confirmed by the client). Two overlapping audiences: people in Buenos Aires, and people in the cities Nico tours (Glasgow, Edinburgh, Belfast, Liverpool, Manchester, Berlin).

## Product Purpose

Portfolio site for Nico Tatuaggi, a realism/color/cover-up tattoo artist, to showcase finished work and convert visitors into booking inquiries via WhatsApp, Instagram, or the "Pedí tu ciudad" contact form. A destinations widget also communicates upcoming tour cities/dates so visitors know when/where they can get tattooed.

## Positioning

Specialist in photorealism, black & grey, color, and cover-ups, differentiated by touring internationally (Buenos Aires plus a recurring UK/Ireland/Germany circuit) rather than being tied to a single fixed studio.

## Operating Context

Visitors mostly arrive from Instagram/WhatsApp on a phone, scroll the portfolio grid, open an individual piece to see detail/scale/healing status (sometimes across multiple photos or a video of the same work), then contact via WhatsApp/Instagram or submit "Pedí tu ciudad" if there's no confirmed date in their city yet.

## Capabilities and Constraints

Astro static site, content fetched at build time from a self-hosted Directus CMS (no client-side auth, no SSR). Content (title/caption, photo+video gallery, style tags, `en_proceso`/healing flag) is managed by the client in Directus. Photos are cropped 4:5 on upload; a single work's gallery can mix photos and videos, video count and order vary per work. Site rebuilds via a Directus-triggered webhook, not on every content edit automatically — there can be a lag between a Directus edit and it going live.

## Brand Commitments

"Nico Tatuaggi" name/brand. An established black + gold (`tattoo-gold`) visual identity is already in consistent use across the site (nav, grid cards, buttons, badges) — this is a binding constraint for the modal redesign, not open for reinvention. The grid card's style-tag treatment (Realismo, Black and Grey, Color, Cover Up) is explicitly called out by the client as already correct and must not change.

## Evidence on Hand

51 real tattoo works live in Directus (ids 53–103), each with a real photo/video gallery and a real Spanish caption written in a confident, humorous voice (references fictional characters or public personas without naming real people directly, per an explicit project rule). Style tags in use: Realismo, Color, Black and Grey, Cover Up. No placeholder/lorem content in this surface.

## Product Principles

1. Mobile-first: the confirmed majority of clients view the portfolio on a phone via social referral — the mobile layout is the priority baseline, not a scaled-down afterthought of desktop.
2. The tattoo photo/video is the product being sold — it must dominate the modal and never be cropped, shrunk, or covered for the sake of fitting text.
3. This is a trust surface: the visitor is deciding whether to get *permanent* work done by this artist, so the modal must read as professional/high-end (industry benchmark: Tattoodo/Inkbox-tier lightboxes), not like a generic image popup.
4. Nothing in the redesign should add friction to reaching WhatsApp/Instagram or the booking flow.

## Accessibility & Inclusion

No client-specified requirement beyond standard public-web expectations (contrast, touch target size, keyboard/escape-to-close already present in the incumbent modal).
