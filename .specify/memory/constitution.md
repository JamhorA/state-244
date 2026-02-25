<!--
SYNC IMPACT REPORT
==================
Version Change: None → 1.0.0 (initial version)
Modified Principles: N/A (initial creation)
Added Sections: All sections (initial creation)
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md - Already aligned with generic constitution gates
  ✅ spec-template.md - Already supports MVP-first and security constraints
  ✅ tasks-template.md - Already supports phased, story-based development
  ⚠ commands/ - No command templates found, manual review if added later
Follow-up TODOs: None
-->

# State 244 Hub Constitution

## Core Principles

### I. Ship Fast, Stay Stable

MVP-first approach is mandatory. Every feature must ship quickly with minimal
viable functionality, then iterate based on real user feedback. No
over-engineering, no unnecessary infrastructure complexity, and deploy early
rather than perfect. The system must be deployable within one day using AI
agents.

**Rationale**: Time-to-market is critical for State 244 Hub. Complexity kills
delivery speed and maintenance viability. MVP allows validation of assumptions
before investing in full-featured implementations.

### II. Public vs Internal Separation

Clear separation between public and internal access is non-negotiable.

Public users (no authentication) can:
- View Top 3 Alliances
- View alliance presentation pages
- Submit migration applications

Login is required for:
- Internal real-time communication
- Alliance member management
- Migration application processing
- AI-generated content access

Internal AI-generated images MUST NEVER be publicly accessible.

**Rationale**: Protects sensitive alliance communications and AI-generated
assets while maintaining an open public-facing presence for recruitment and
informational purposes.

### III. Role Governance

Five distinct roles with strictly enforced permissions:

- **Public**: Unauthenticated, view-only access to public pages and application
  form
- **Applicant**: Has submitted a migration application, no internal access
- **Member**: Authenticated alliance member, can access internal features
- **R4 (Officer)**: Can assist with application handling and manage alliance
  content (if permitted by R5)
- **R5 (Leader)**: One per alliance, manages alliance profile, member roles,
  and migration approvals

Role enforcement MUST be handled in application logic, not UI only.

**Rationale**: Hierarchical governance reflects in-game alliance structure.
Clear role boundaries prevent privilege escalation and enable proper delegation.

### IV. AI Usage Principles

AI is used exclusively for:
- Generating alliance presentation text drafts from bullet points + tone
- Generating internal-use images only

Constraints:
- AI output MUST be editable before publishing
- AI usage MUST be rate-limited (e.g., 5 images per user per day)
- AI images are internal-only, never publicly accessible
- AI API keys MUST be server-side only, never exposed client-side

**Rationale**: AI augments creativity but requires human review. Rate limits
prevent abuse. Server-side keys prevent credential leakage.

### V. Realtime Principles

MVP includes exactly one global cross-alliance room: "State 244 Diplomacy".

Realtime MUST support:
- Text messages
- Image attachments (stored securely in Supabase Storage)
- Real-time updates via Supabase Realtime subscriptions

Only authenticated users can access chat. Future extension: per-alliance rooms.

**Rationale**: Single global room enables diplomatic communication between
alliances while minimizing complexity. Authenticated access prevents spam and
protects internal discussions.

## Security & Abuse Prevention

Public migration form MUST include:
- Rate limiting to prevent spam
- Honeypot anti-spam fields
- Basic validation

Additional security requirements:
- All admin actions MUST be auditable
- Internal data MUST NOT leak to public routes
- Secrets MUST NEVER be exposed client-side (environment variables only)
- Storage buckets MUST enforce access controls

**Rationale**: Public-facing forms are prime targets for spam. Audit trails
enable accountability. Secret protection prevents credential compromise.

## Definition of Done

The system is considered complete when ALL of the following are met:

1. Public users can view Top 3 Alliances and submit migration applications
2. R5 users can manage alliance members and profiles
3. Top 3 Alliances can process migration applications (approve/reject)
4. Internal authenticated users can chat in real-time with image sharing
5. AI text generation for alliance presentations works end-to-end
6. AI image generation for internal use works with proper quotas
7. Application is deployed on Netlify with auto-deploy from GitHub
8. Supabase is connected and functional (Auth, Database, Realtime, Storage)
9. All environment variables are configured in Netlify UI (not hardcoded)
10. Public vs Internal separation is verified and functional

**Rationale**: Clear completion criteria prevent scope creep and ensure all
MVP requirements are met before calling a feature "done."

## Governance

This constitution supersedes all other development practices and decision
frameworks.

### Amendment Procedure

Constitution amendments require:
1. Documented rationale for the change
2. Approval by project stakeholders
3. Version increment following semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
4. Migration plan for any breaking changes
5. Updates to dependent templates (plan, spec, tasks)

### Compliance Review

All PRs and implementation reviews MUST verify:
- Compliance with role-based access rules
- No public exposure of internal features
- No client-side secret exposure
- MVP-first principle is maintained

Complexity beyond these principles MUST be explicitly justified in
Complexity Tracking section of implementation plans.

Use project README.md for runtime development guidance and setup instructions.

**Version**: 1.0.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
