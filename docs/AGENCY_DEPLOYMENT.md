# Using OpenSEO for an agency

OpenSEO projects have dashboards for search performance, site audits and other
SEO data. In the self-hosted password installation, an organization owner can
create a customer workspace from the account menu. Create a workspace for
each customer, switch into it, and create that customer's projects there. In
Settings, use the Organization tab to invite the customer and the agency
staff who need access. Switch workspaces from the account menu.

Choose a role when you invite someone:

- **Admin**, for agency staff: full access to every project in the workspace,
  except billing.
- **Viewer**, for the customer: read-only access to every project's dashboard,
  rank tracking, Search Console insights, site audits, prompt tracking, saved
  keywords and reports. Viewers cannot run keyword, domain, backlink or prompt
  research, start audits or rank checks, change projects or settings, invite
  people, or connect an AI agent over MCP. The server refuses these actions,
  so a viewer cannot spend DataForSEO credits beyond the dashboard's daily
  backlink refresh.

A workspace is the access boundary, not an individual project, so do not put
different customers' projects in the same workspace. Each agency staff member
needs an invitation to each customer workspace they work on. Invitations in
password mode produce a link to share directly.

Use password authentication and HTTPS for customer-facing deployments; follow
the [Docker self-hosting guide](SELF_HOSTING_DOCKER.md) for setup and backups.
Build the image from this fork using `deploy/standalone/compose.build.yaml`, as
described in that guide's build-from-source section. The upstream prebuilt image
does not include the agency changes.
Do not use `local_noauth` for a customer-facing installation. Before inviting
customers, test both browser and MCP access with accounts belonging to
different workspaces.

## Agents and models

External agents can connect to the installation's `/mcp` endpoint using an
OpenSEO account or an OpenSEO API key. An MCP credential is tied to the active
workspace when it is created. Create a separate connection or key for each
customer workspace the agent needs. See the MCP instructions in the Docker guide.
ChatGPT, Codex and Claude Code use their own supported sign-in and billing
arrangements; connecting them to OpenSEO does not turn a subscription into an
API key for OpenSEO's built-in agent.

The built-in SAM agent uses an OpenRouter API key. Set `OPENROUTER_API_KEY` and,
optionally, `OPENROUTER_MODEL` as described in the Docker guide. API usage is
billed by the provider. Check the provider's data handling terms before sending
customer information to a model.

## Brand names in Prompt Tracking

Prompt Tracking counts a brand as mentioned when an AI answer names it, its
domain, or one of its other names. Add other names, such as "HelpScout" for
"Help Scout" or a former brand name, under Brand names and on each competitor
in the project's Context page. Agents can set them with
`update_project_context`. New names apply to answers collected from then on;
earlier results are not recalculated.

## Analytics

The project dashboard can show Google Analytics data after GA4 is connected.
Project settings also allow a PostHog Cloud project or an Umami Cloud website
to be connected. PostHog needs a personal API key with project query read
access and the correct EU or US region. Umami needs a Cloud API key and website
ID. Keys are encrypted in the database and are never returned to the browser.
Disconnecting deletes the stored connection. Each card shows all traffic for
the selected property over the last 28 days; PostHog's distinct IDs are not
necessarily equivalent to Umami visitors. Select properties that contain only
the customer data that workspace members may see. Self-hosted PostHog and
Umami servers are not supported by these connections yet.

OpenSEO's own PostHog telemetry is separate from customer website analytics.
