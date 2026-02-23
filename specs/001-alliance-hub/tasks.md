# Tasks: State 244 Hub – MVP

**Input**: Design documents from `/specs/001-alliance-hub/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/
**Tests**: No test tasks included (tests not explicitly requested in feature specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below use single project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Next.js project structure with route groups (src/app/(public), src/app/(internal), src/components, src/hooks, src/types)
- [ ] T002 [P] Install dependencies (next, react, @supabase/supabase-js, typescript)
- [ ] T003 [P] Configure TypeScript in tsconfig.json with strict mode and path aliases (@/*)
- [ ] T004 [P] Create .env.local template with environment variable placeholders (SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY)
- [ ] T005 [P] Create .gitignore for node_modules, .next, .env.local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Create Supabase client configuration in src/lib/supabase.ts
- [ ] T007 [P] Create authentication utilities in src/lib/auth.ts (signIn, signOut, getCurrentUser)
- [ ] T008 [P] Create TypeScript types in src/types/index.ts (User, Profile, Alliance, Application, ChatMessage)
- [ ] T009 [P] Create authentication middleware for internal routes in src/app/(internal)/middleware.ts
- [ ] T010 Create authentication hook in src/hooks/use-auth.ts
- [ ] T011 [P] Create role-based access hook in src/hooks/use-role.ts
- [ ] T012 [P] Create Supabase database migration file for schema (profiles, alliances, migration_applications, chat_messages, ai_generated_images, alliance_presentations, rate_limits, enums, indexes, triggers, RLS policies)
- [ ] T013 [P] Create AI integration library in src/lib/ai.ts (OpenAI client configuration, text generation function, image generation function)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Public Alliance Discovery (Priority: P1) 🎯 MVP

**Goal**: Public users can view Top 3 Alliances on landing page and navigate to individual alliance profiles

**Independent Test**: A public user visits the landing page and sees 3 alliances with name, rank, description, and can click through to alliance profile

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create AllianceCard component in src/components/alliance/AllianceCard.tsx
- [ ] T015 [P] [US1] Create AllianceList component in src/components/alliance/AllianceList.tsx
- [ ] T016 [US1] Create public landing page in src/app/(public)/page.tsx (displays Top 3 Alliances)
- [ ] T017 [US1] Create alliance profile page in src/app/(public)/alliances/[id]/page.tsx
- [ ] T018 [US1] Create AllianceProfile component in src/components/alliance/AllianceProfile.tsx
- [ ] T019 [US1] Create alliance list data fetching in src/lib/alliances.ts (fetchTop3Alliances, fetchAllianceById)
- [ ] T020 [US1] Implement Supabase query for Top 3 Alliances in src/lib/alliances.ts
- [ ] T021 [US1] Add error handling for alliance not found (404 page)
- [ ] T022 [US1] Add responsive styling for alliance cards and profile pages

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Migration Application Submission (Priority: P1) 🎯 MVP

**Goal**: Public users can submit migration applications for Top 3 Alliances with form validation and success confirmation

**Independent Test**: A public user fills out the application form, submits successfully, and sees a confirmation page

### Implementation for User Story 2

- [ ] T023 [P] [US2] Create MigrationApplicationForm component in src/components/forms/MigrationApplicationForm.tsx
- [ ] T024 [P] [US2] Add form validation to MigrationApplicationForm (required fields, character limits)
- [ ] T025 [P] [US2] Add honeypot anti-spam field to MigrationApplicationForm (CSS-hidden "website" field)
- [ ] T026 [US2] Create application success page in src/app/(public)/apply/success.tsx
- [ ] T027 [US2] Create API route for application submission in src/app/api/applications/route.ts (POST, public access)
- [ ] T028 [US2] Implement rate limiting for application submission in src/app/api/applications/route.ts (check rate_limits table for IP)
- [ ] T029 [US2] Implement honeypot validation in src/app/api/applications/route.ts (reject if website field has value)
- [ ] T030 [US2] Implement application data insertion in src/app/api/applications/route.ts (insert into migration_applications table)
- [ ] T031 [US2] Add success/error response handling in MigrationApplicationForm component
- [ ] T032 [US2] Add error boundary and user-friendly error messages

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Alliance Member Authentication and Access (Priority: P1) 🎯 MVP

**Goal**: Authenticated alliance members can log in and access internal features including dashboard, chat, and their profile

**Independent Test**: An authenticated user logs in, is redirected to their dashboard, and can access internal pages

### Implementation for User Story 3

- [ ] T033 [P] [US3] Create login page in src/app/login/page.tsx
- [ ] T034 [P] [US3] Create internal layout with auth check in src/app/(internal)/layout.tsx
- [ ] T035 [P] [US3] Create member dashboard page in src/app/(internal)/dashboard/page.tsx
- [ ] T036 [P] [US3] Create Dashboard component in src/components/dashboard/Dashboard.tsx
- [ ] T037 [P] [US3] Create ProfileDisplay component in src/components/dashboard/ProfileDisplay.tsx
- [ ] T038 [P] [US3] Create ProfileEdit component in src/components/dashboard/ProfileEdit.tsx
- [ ] T039 [US3] Implement sign-in functionality in src/app/login/page.tsx (using Supabase Auth)
- [ ] T040 [US3] Implement sign-out functionality in src/components/ui/SignOutButton.tsx
- [ ] T041 [US3] Implement profile data fetching in src/lib/profiles.ts (fetchProfile, updateProfile)
- [ ] T042 [US3] Implement profile update in src/lib/profiles.ts (update via Supabase)
- [ ] T043 [US3] Add redirect logic for unauthenticated users accessing internal routes in src/app/(internal)/layout.tsx
- [ ] T044 [US3] Add loading states for auth and data fetching

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - Alliance Leadership Application Management (Priority: P2)

**Goal**: R4 and R5 users can view, review, and update migration application statuses for their alliance with real-time updates

**Independent Test**: An R5 logs in, navigates to applications page, sees all applications for their alliance, changes an application status, and sees the update reflected without page reload

### Implementation for User Story 4

- [ ] T045 [P] [US4] Create applications list page in src/app/(internal)/applications/page.tsx
- [ ] T046 [P] [US4] Create ApplicationList component in src/components/applications/ApplicationList.tsx
- [ ] T047 [P] [US4] Create ApplicationCard component in src/components/applications/ApplicationCard.tsx
- [ ] T048 [P] [US4] Create StatusBadge component in src/components/applications/StatusBadge.tsx
- [ ] T049 [P] [US4] Create status update buttons (Approve/Reject/Reviewing) in ApplicationCard component
- [ ] T050 [US4] Create API route for fetching applications in src/app/api/applications/route.ts (GET, R4/R5 only)
- [ ] T051 [US4] Create API route for updating application status in src/app/api/applications/[id]/route.ts (PATCH, R4/R5 only)
- [ ] T052 [US4] Implement RLS policy check in src/app/api/applications/[id]/route.ts (verify user is R4/R5 and owns alliance)
- [ ] T053 [US4] Implement real-time subscription for application status updates in src/hooks/use-realtime.ts
- [ ] T054 [US4] Create useApplications hook in src/hooks/use-applications.ts
- [ ] T055 [US4] Implement status update function in src/lib/applications.ts
- [ ] T056 [US4] Add role-based access check (R4/R5 only) in src/app/(internal)/applications/page.tsx
- [ ] T057 [US4] Add real-time status update listeners to ApplicationCard component
- [ ] T058 [US4] Add error handling and confirmation dialogs for status changes

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently

---

## Phase 7: User Story 5 - Real-Time Diplomatic Chat (Priority: P2)

**Goal**: Authenticated alliance members can participate in the global "State 244 Diplomacy" chat room with text messages and image attachments, with real-time message delivery

**Independent Test**: Two authenticated users open the chat, one sends a text message and an image, and both see the messages appear in real-time

### Implementation for User Story 5

- [ ] T059 [P] [US5] Create chat page in src/app/(internal)/chat/page.tsx
- [ ] T060 [P] [US5] Create ChatRoom component in src/components/chat/ChatRoom.tsx
- [ ] T061 [P] [US5] Create MessageList component in src/components/chat/MessageList.tsx
- [ ] T062 [P] [US5] Create MessageInput component in src/components/chat/MessageInput.tsx
- [ ] T063 [P] [US5] Create MessageBubble component in src/components/chat/MessageBubble.tsx
- [ ] T064 [P] [US5] Create ImageUploadButton component in src/components/chat/ImageUploadButton.tsx
- [ ] T065 [P] [US5] Create API route for chat message history in src/app/api/chat/messages/route.ts (GET, authenticated only)
- [ ] T066 [US5] Create API route for sending messages via Broadcast in src/app/api/chat/route.ts (POST, authenticated only)
- [ ] T067 [US5] Implement image upload to private storage bucket in src/app/api/chat/route.ts
- [ ] T068 [US5] Implement Supabase Realtime subscription for chat messages in src/hooks/use-realtime.ts
- [ ] T069 [US5] Create useChatMessages hook in src/hooks/use-chat-messages.ts
- [ ] T070 [US5] Implement message sending function in src/lib/chat.ts
- [ ] T071 [US5] Implement message history fetching in src/lib/chat.ts
- [ ] T072 [US5] Add auto-scroll to latest messages in MessageList component
- [ ] T073 [US5] Add loading states and error handling for chat
- [ ] T074 [US5] Add timestamp formatting to MessageBubble component

**Checkpoint**: At this point, User Story 5 should be fully functional and testable independently

---

## Phase 8: User Story 6 - AI-Powered Alliance Presentation Generation (Priority: P2)

**Goal**: R4 and R5 users can generate alliance presentation text from bullet points and tone, review, edit, and publish to public alliance profile

**Independent Test**: An R5 logs in, enters bullet points and tone, generates presentation text, reviews and edits the draft, and saves it to the alliance profile

### Implementation for User Story 6

- [ ] T075 [P] [US6] Create AI text generator page in src/app/(internal)/ai/text/page.tsx
- [ ] T076 [P] [US6] Create AITextForm component in src/components/ai/AITextForm.tsx
- [ ] T077 [P] [US6] Create AITextEditor component in src/components/ai/AITextEditor.tsx
- [ ] T078 [P] [US6] Create ToneSelector component in src/components/ai/ToneSelector.tsx
- [ ] T079 [US6] Create API route for AI text generation in src/app/api/ai/text/route.ts (POST, R4/R5 only)
- [ ] T080 [US6] Implement OpenAI GPT-4 text generation in src/app/api/ai/text/route.ts
- [ ] T081 [US6] Implement RLS policy check in src/app/api/ai/text/route.ts (verify user is R4/R5)
- [ ] T082 [US6] Create API route for saving/publishing presentation in src/app/api/alliance/presentation/route.ts (PUT, R5 only)
- [ ] T083 [US6] Implement presentation save function in src/lib/presentations.ts
- [ ] T084 [US6] Add role-based access check (R4/R5 only) in src/app/(internal)/ai/text/page.tsx
- [ ] T085 [US6] Add loading state for AI generation in AITextForm component
- [ ] T086 [US6] Add error handling and retry logic for AI API calls
- [ ] T087 [US6] Implement presentation publishing workflow (save to alliance_presentations table, then update alliances.description)

**Checkpoint**: At this point, User Story 6 should be fully functional and testable independently

---

## Phase 9: User Story 7 - Internal AI Image Generation (Priority: P3)

**Goal**: Authenticated members can generate internal alliance images (banners, emblems, logo drafts) with rate limiting (5 images/user/day)

**Independent Test**: A member logs in, generates an AI image, sees the image displayed, and receives a rate limit error after 5 attempts

### Implementation for User Story 7

- [ ] T088 [P] [US7] Create AI image generator page in src/app/(internal)/ai/image/page.tsx
- [ ] T089 [P] [US7] Create AIImageForm component in src/components/ai/AIImageForm.tsx
- [ ] T090 [P] [US7] Create ImageGallery component in src/components/ai/ImageGallery.tsx
- [ ] T091 [P] [US7] Create ImageTypeSelector component in src/components/ai/ImageTypeSelector.tsx
- [ ] T092 [US7] Create API route for AI image generation in src/app/api/ai/image/route.ts (POST, authenticated only)
- [ ] T093 [US7] Implement OpenAI DALL-E 3 image generation in src/app/api/ai/image/route.ts
- [ ] T094 [US7] Implement rate limiting check in src/app/api/ai/image/route.ts (check rate_limits table for user_id)
- [ ] T095 [US7] Implement image storage to private bucket in src/app/api/ai/image/route.ts
- [ ] T096 [US7] Implement image data insertion in src/app/api/ai/image/route.ts (insert into ai_generated_images table)
- [ ] T097 [US7] Create useGeneratedImages hook in src/hooks/use-generated-images.ts
- [ ] T098 [US7] Implement image generation function in src/lib/ai.ts
- [ ] T099 [US7] Implement generated images fetching in src/lib/ai.ts
- [ ] T100 [US7] Add loading state for AI generation in AIImageForm component
- [ ] T101 [US7] Add error handling and rate limit display in AIImageForm component
- [ ] T102 [US7] Add image preview and download functionality in ImageGallery component

**Checkpoint**: At this point, User Story 7 should be fully functional and testable independently

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T103 [P] Add responsive design for all pages (mobile-first approach)
- [ ] T104 [P] Add loading skeletons for all data fetching states
- [ ] T105 [P] Implement global error boundary in src/app/error.tsx
- [ ] T106 [P] Add 404 not found page in src/app/not-found.tsx
- [ ] T107 [P] Add consistent UI components (Button, Input, Card) in src/components/ui/
- [ ] T108 [P] Add navigation bar component in src/components/ui/NavBar.tsx
- [ ] T109 [P] Implement toast notification system for user feedback in src/components/ui/Toast.tsx
- [ ] T110 [P] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] T111 [P] Add page titles and meta tags for SEO
- [ ] T112 [P] Run build and verify no TypeScript errors
- [ ] T113 [P] Test all user flows end-to-end manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US3 for authentication
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Depends on US3 for authentication
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Depends on US3 for authentication

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001-T005)
- All Foundational tasks marked [P] can run in parallel (T006-T013)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All component creation tasks marked [P] within a story can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 5 (Chat)

```bash
# Launch all component creation tasks together:
Task: "Create ChatRoom component in src/components/chat/ChatRoom.tsx"
Task: "Create MessageList component in src/components/chat/MessageList.tsx"
Task: "Create MessageInput component in src/components/chat/MessageInput.tsx"
Task: "Create MessageBubble component in src/components/chat/MessageBubble.tsx"
Task: "Create ImageUploadButton component in src/components/chat/ImageUploadButton.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013) - CRITICAL
3. Complete Phase 3: User Story 1 (T014-T022)
4. Complete Phase 4: User Story 2 (T023-T032)
5. Complete Phase 5: User Story 3 (T033-T044)
6. **STOP and VALIDATE**: Test MVP (US1-US3) independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Add User Story 7 → Test independently → Deploy/Demo
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total tasks: 113
- Tasks per user story: US1(9), US2(10), US3(12), US4(14), US5(16), US6(13), US7(15), Polish(11)
- Suggested MVP scope: User Stories 1, 2, and 3 (31 tasks total)
