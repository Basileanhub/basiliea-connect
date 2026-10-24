<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use TanStack file routes for each public ministry page and shared navigation in the root shell, so every page has a direct address and metadata.
- Keep Cloudflare calls server-side through the linked connector gateway; D1 and authenticated features must remain unavailable until verified permissions and secure identity handling are configured.
- Use uploaded Bible assets for document reading/downloads; never label the uploaded Bower book as an NLT translation.
- Events are one row per program day (event_date); days without a row are free days, so admins control the calendar by adding only program days.
- Seed the browser query cache from the root route loader so server and browser render the same shared content.
