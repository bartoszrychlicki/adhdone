# Child Routines Tabbed UI

## Summary
- Merge the existing “Start” and “Rutyny” experiences into a single screen where a child can browse and perform routines without navigating into separate detail pages.
- Surface all routine tasks inline within tabs, highlighting the routine that is currently active and dimming those that are inactive or already completed.
- Maintain the existing session plumbing (`fetchChildRoutineSessionViewModelForChild`) and completion flow, but refactor the presentation layer to support inline task interactions and richer status messaging.

## Goals
- Make the child dashboard actionable at a glance: upon sign-in a child immediately sees the tasks for the routine that is available “right now”.
- Allow the child to preview any other routine (upcoming or completed) without the ability to interact with inactive ones.
- Provide clear contextual messaging about availability windows, progress, and historical performance.

## Non-Goals
- No changes to parent-facing configuration, scheduling, or the Supabase data model.
- No changes to auth or session logic beyond what is already implemented for link + PIN sign-in.
- No redesign of reward screens or post-completion celebration beyond layout adjustments documented here.

## Personas & Entry Points
- **Child user** arriving via unique link + PIN, redirected to `/child/routines`.
- The page must remain accessible from parent “Wejdź jako dziecko” masquerading flow; tabs must load correctly when the parent switches into child context.

## High-Level UX
1. **Hero metrics band (above tabs)**  
   - Display routine-level stats relevant for the current day (total routines available, total points, streak, etc.). Re-use data already queried for the current routines board.
   - Content always visible; do not collapse when switching tabs.
2. **Tabbed routines section**  
   - One tab per routine returned in the child routine board response. Preferred ordering:
     1. Active routine (determined algorithmically, see below).
     2. Remaining `board.today` routines sorted by start time ascending.
     3. `board.upcoming` routines sorted by start time ascending.
     4. `board.completed` routines sorted by completion timestamp descending.
   - Each tab label should show routine name, total points available (e.g., `Poranna (120 pkt)`), and a compact status chip (e.g., “Dostępna teraz”, “Wkrótce 18:00”, “Ukończona”).
   - Default selected tab = first tab (active routine when present; fallback to earliest upcoming; final fallback to first completed).
   - Once the active routine enters an “in progress” state (at least one task started within the current session), lock other tabs (`aria-disabled`) and show tooltip text such as “Zakończ aktualną rutynę, aby zobaczyć pozostałe” to keep the child focused. Tabs unlock again after the routine is completed or the session resets.
3. **Task list panel (per tab)**  
   - Tasks render immediately below the tabs, without any further navigation.
   - Active routine tasks keep the existing interactive controls (checklist items, timers, points, etc.).
   - Inactive routine tasks (upcoming or already completed today) render in a visually muted state:
     - Apply grayscale/opacity treatment to rows.
     - Disable interactive affordances (buttons, checkboxes).
     - Show inline message above the list:  
       “Ta rutyna jest teraz nieaktywna. Będzie dostępna o {startAt}.”  
       If `startAt` is `null`, fall back to “Rutyna będzie dostępna wkrótce”.
   - Completed routine tabs should display last-run metadata:
     - Each task marked as completed with timestamp/points earned if available.
     - Summary chip with “Ukończono w {duration}” using the most recent session duration.
4. **Completion panel (sticky footer)**  
   - Visible only on the active routine tab.
   - Contains primary button “Zakończ rutynę” (or localized equivalent) that triggers the existing completion action and success flow.
   - When the routine is not yet fully complete, button should guide the child (e.g., disabled with tooltip “Zakończ wszystkie zadania, aby ukończyć” or show remaining tasks count).

## Active Routine Determination
1. Use existing `ChildRoutineBoardData` buckets:
   - `board.today`: routines whose availability window includes the current time.
   - `board.upcoming`: future routines.
   - `board.completed`: already finished sessions.
2. Selection algorithm:
   - If `board.today` is non-empty, choose the earliest by `startAt` >= now (fall back to first element).
   - Else if `board.upcoming` is non-empty, choose the earliest by `startAt`.
   - Else fallback to the most recently completed routine (first in `board.completed`).
3. Expose helper utility (server-side) that returns the ordered list plus active routine ID so both RSC and client hooks can align.

## Content States
- **Active routine with pending tasks**: interactive checklist, footer button enabled once all required tasks complete, show progress meter (e.g., tasks done / total).
- **Active routine with zero configured tasks**: render informational card stating “Brak zadań w tej rutynie. Ostatnio ukończono w {duration}.” and surface the most recent session duration; footer button stays hidden to avoid confusion.
- **Active routine fully completed (current day)**:  
  - Tasks remain visible with completion styling (checkmarks + completion timestamps if available).  
  - Above list, show message “Brawo! Wykonałeś całą rutynę o {completionTime}. Łączny czas: {totalDuration}.”  
  - Footer button transitions to “Przejdź dalej” and leads to celebration/success route.
- **Inactive routine (upcoming)**:  
  - Message with next availability.  
  - Tasks greyed-out with lock icon or overlay.  
  - Footer hidden.
- **Completed routine (past)**:  
  - Keep greyed style but replace availability message with short recap: “Ostatnio ukończono {completedAgo}. Czas wykonania: {duration}.”  
  - Consider secondary action “Zobacz nagrody” when relevant (optional stretch).
- **No routines returned**:  
  - Empty state card encouraging the child to refresh later or notify parent.  
  - CTA “Wróć do panelu głównego”.

## Technical Notes
- Keep the page as a Server Component for initial render using `requireChildSession` and existing Supabase service role queries.
- Tab state can be hydrated via a lightweight client component; prefer a single `useState` for selected routine ID.
- Expose routine/task metadata via a typed view model to minimize client-side data shaping.
- Reuse existing task mutation handlers (start/complete) by forwarding appropriate session IDs. Ensure they short-circuit when invoked on inactive tabs.
- Ensure timezone-aware formatting uses the child profile timezone (determine from Supabase row) to avoid mismatched availability messaging.
- Build interactive elements (tabs, badges, cards, buttons) using shadcn/ui primitives already adopted in the project to preserve visual and behavioral consistency.
- Expose a client-side flag that reflects “routine in progress” so the tab list can disable other tabs while the active session is underway; ensure the lock state survives soft navigations (e.g., via URL query or server revalidation).
- Real-time auto-switching between routines is not required; selecting a new active routine can remain a manual action (e.g., after page refresh or completion).

## Accessibility
- Tabs must be keyboard navigable (ARIA `role="tablist"` et al.).
- Disabled tasks should include `aria-disabled="true"` and keep text contrast sufficient for readability.
- Announce key state changes (e.g., when active routine switches) via polite live region.

## Analytics & Telemetry (Optional)
- Track tab switch events with routine ID and status bucket to monitor engagement patterns.
- Track completion flow entry/exit timestamps for duration analytics.

## Edge Cases
- Child has multiple active routines overlapping: display them in `board.today` order; default tab selects the earliest `startAt`, but allow child to switch to the other active tab (still interactive).
- Routine without `startAt`/`endAt`: treat as always available within its bucket; messaging defaults to generic copy.
- Tasks flagged as optional: still listed but clearly annotated so child understands they can skip.
- Supabase latency/partial failures: show retry affordance on data fetch errors instead of blank screen.

## Acceptance Criteria
- Upon login as Eryk (child ID `2b0a4887-6397-4867-8dd1-278e3d360a93`), the routines view auto-selects the currently active routine tab and displays actionable tasks inline.
- Switching to an upcoming routine tab displays greyed tasks plus the “rutyna jest teraz nieaktywna” message with the correct availability time.
- Completed routine tabs show the last completion duration and keep tasks in completed style.
- “Zakończ rutynę” button is only present on the active tab and successfully transitions to the success flow when all tasks are complete.
- Tab labels display cumulative routine points, and when a routine is in progress the UI prevents switching to other tabs until completion.
- All new UI passes existing lint rules and manual verification across Chrome + Safari (per project testing guidelines).

## Implementation Checklist (for future tasking)
- [x] Update routines page layout to include stats band + tabs + inline task lists.
- [x] Introduce shared tab component (server/client hybrid) following accessibility guidelines.
- [x] Add inactive routine messaging + styling tokens to Tailwind theme or component scope.
- [x] Wire sticky completion panel and ensure success redirect compatibility.
- [ ] Verify timezone formatting using child profile timezone field.
- [ ] Refresh Playwright smoke scripts to cover tab switching and completion flow.
- [x] Add targeted React component tests (e.g., `ChildRoutineTabs.spec.tsx`) once test harness is finalized.

## Implementation Notes
- The new `ChildRoutineTabs` client component (shadcn/ui tabs) renders interactive tasks for the active routine, greys out inactive ones, and calls `/api/v1/sessions/:id/complete` when the child finishes. It also guards tab switching while a session is in progress and routes to the success screen after completion.
- `buildChildRoutineTabsModel` in `src/app/child/routines/tab-model.ts` normalizes Supabase data into the structure the tabs component expects (status badges, availability copy, mandatory-task tracking, success URLs).
- Model builder ensures exactly jedna rutyna jest oznaczona jako aktywna oraz sprawdza bieżący czas względem okna start–koniec; rutyny, których okno jeszcze się nie rozpoczęło (lub już minęło), pozostają w stanie „Wkrótce” z komunikatem o konieczności poczekania lub dokończenia wcześniejszej misji.
- `/child/routines/page.tsx` now fetches per-session view models, shows hero stats (available routines, total points, streak, wallet balance), and renders the tabbed experience directly—removing the old cards grid.
- Vitest coverage lives in `src/__tests__/child-routines-tabs.spec.tsx` and `src/__tests__/child-routine-tab-model.spec.ts`, ensuring sequential task handling, completion calls, and state ordering stay consistent with the spec.
