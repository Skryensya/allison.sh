# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into allison.sh. Here's a summary of what changed:

- **`src/layouts/Base.astro`**: Replaced the hardcoded PostHog snippet with one that reads credentials from environment variables (`PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST`). Added the `window.__posthog_initialized` guard required by Astro's ClientRouter to prevent stack overflow during soft navigation. Switched from `capture_pageview: false` (with a manual `$pageview` listener) to `capture_pageview: 'history_change'` for automatic pageview tracking during view transitions.

- **`src/scripts/base-client.ts`**: Added `theme_toggled` event capture when the user switches between dark and light mode. Added delegated `contact_link_clicked` event capture on all footer contact links (email, LinkedIn, GitHub), including a `platform` property identifying which channel was used.

- **`src/scripts/project-folder-stack-client.ts`**: Added `project_clicked` event on project folder card clicks from the main portfolio view, and `next_project_clicked` for clicks on the "siguiente" navigation card at the bottom of project pages. Both include a `project_slug` property.

- **`src/scripts/project-lightbox-client.ts`**: Added `project_image_expanded` event when a user opens an image in the lightbox, and `project_image_navigated` when navigating between images. Both include `project_slug` and positional metadata.

- **`.env`**: Created with `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` values (covered by `.gitignore`).

## Events

| Event | Description | File |
|---|---|---|
| `project_clicked` | User clicks a project folder card from the portfolio | `src/scripts/project-folder-stack-client.ts` |
| `next_project_clicked` | User clicks the "siguiente" project at the bottom of a project page | `src/scripts/project-folder-stack-client.ts` |
| `project_image_expanded` | User opens a project image in the lightbox | `src/scripts/project-lightbox-client.ts` |
| `project_image_navigated` | User navigates between images within the lightbox | `src/scripts/project-lightbox-client.ts` |
| `contact_link_clicked` | User clicks a contact link (email, LinkedIn, or GitHub) | `src/scripts/base-client.ts` |
| `theme_toggled` | User switches between light and dark theme | `src/scripts/base-client.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard** — [Analytics basics](https://us.posthog.com/project/146664/dashboard/1515916)
- **Insight** — [Project clicks by slug](https://us.posthog.com/project/146664/insights/slubUK1b) — which projects get the most attention
- **Insight** — [Contact link conversion funnel](https://us.posthog.com/project/146664/insights/1T8ken9g) — what percentage of visitors reach out
- **Insight** — [Contact platform breakdown](https://us.posthog.com/project/146664/insights/XI4hRJ3V) — email vs LinkedIn vs GitHub preference
- **Insight** — [Project engagement: clicks → image expanded](https://us.posthog.com/project/146664/insights/zUoh2lwZ) — how many project visitors go deep
- **Insight** — [Theme preference (dark vs light toggles)](https://us.posthog.com/project/146664/insights/ayTzcrWv) — dark/light mode split

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
