import { render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import {
  ChildRoutineTabs,
  type ChildRoutineTabsProps,
  type RoutineTab,
} from "@/app/child/routines/components/ChildRoutineTabs"

const pushMock = vi.fn()
const refreshMock = vi.fn()
const fetchMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

beforeEach(() => {
  pushMock.mockReset()
  refreshMock.mockReset()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
  // @ts-expect-error: Assign test double for fetch in Vitest environment
  global.fetch = fetchMock
})

const buildTasks = (tasks: Array<Partial<RoutineTab["tasks"][number]> & { id: string; title: string }>) =>
  tasks.map((task) => ({
    status: "pending" as const,
    points: 0,
    durationLabel: null,
    durationSeconds: null,
    description: null,
    isOptional: false,
    ...task,
  }))

function buildTabs(overrides: Partial<RoutineTab>[] = []): ChildRoutineTabsProps["tabs"] {
  const base: RoutineTab[] = [
    {
      id: "morning",
      sessionId: "session-morning",
      name: "Poranna",
      points: 120,
      status: "active",
      startLabel: "06:00 – 07:00",
      badgeLabel: "Dostępna teraz",
      availabilityMessage: null,
      completionSummary: null,
      tasks: buildTasks([
        { id: "brush-teeth", title: "Mycie zębów", points: 30 },
        { id: "dress-up", title: "Ubierz się", points: 40 },
      ]),
      isCurrent: true,
      isLocked: false,
      isInProgress: false,
      successHref: "/child/routines/session-morning/success",
      sessionStatus: "scheduled",
      completedTasks: [],
      mandatoryTaskIds: ["brush-teeth", "dress-up"],
    },
    {
      id: "evening",
      sessionId: "session-evening",
      name: "Wieczorna",
      points: 90,
      status: "upcoming",
      startLabel: "19:00 – 20:00",
      badgeLabel: "Wkrótce 19:00",
      availabilityMessage: "Ta rutyna jest teraz nieaktywna. Będzie dostępna o 19:00.",
      completionSummary: null,
      tasks: buildTasks([
        { id: "pyjamas", title: "Piżama", points: 20 },
        { id: "teeth-night", title: "Wieczorne mycie zębów", points: 20 },
      ]),
      isCurrent: false,
      isLocked: false,
      isInProgress: false,
      successHref: "/child/routines/session-evening/success",
      sessionStatus: "scheduled",
      completedTasks: [],
      mandatoryTaskIds: ["pyjamas", "teeth-night"],
    },
    {
      id: "weekend",
      sessionId: "session-weekend",
      name: "Weekendowa",
      points: 60,
      status: "completed",
      startLabel: "Weekend",
      badgeLabel: "Ukończona",
      availabilityMessage: null,
      completionSummary: "Ostatnio ukończono 2 godziny temu. Czas wykonania: 18 min.",
      tasks: buildTasks([
        { id: "games", title: "Porządki w pokoju", status: "completed", points: 30, durationLabel: "5 min" },
        { id: "books", title: "Czytanie", status: "completed", points: 30, durationLabel: "13 min" },
      ]),
      isCurrent: false,
      isLocked: false,
      isInProgress: false,
      successHref: "/child/routines/session-weekend/success",
      sessionStatus: "completed",
      completedTasks: [
        { taskId: "games", completedAt: "2025-01-01T10:00:00Z" },
        { taskId: "books", completedAt: "2025-01-01T10:05:00Z" },
      ],
      mandatoryTaskIds: ["games"],
    },
  ]

  return base.map((tab, index) => ({
    ...tab,
    ...(overrides[index] ?? {}),
  }))
}

function renderTabs(overrides: Partial<RoutineTab>[] = []) {
  const tabs = buildTabs(overrides)
  return render(<ChildRoutineTabs tabs={tabs} />)
}

describe("ChildRoutineTabs spec alignment", () => {
  it("renders active routine by default with inline tasks and completion action", () => {
    renderTabs()

    const activeTab = screen.getByRole("tab", { name: /Poranna \(120 pkt\)/i })
    expect(activeTab).toHaveAttribute("aria-selected", "true")

    expect(screen.getByText("Mycie zębów")).toBeInTheDocument()
    expect(screen.getByText("Ubierz się")).toBeInTheDocument()

    const footer = screen.getByRole("region", { name: /panel zakończenia rutyny/i })
    expect(within(footer).getByRole("button", { name: /Zakończ rutynę/i })).toBeDisabled()
  })

  it("shows total points in each tab label", () => {
    renderTabs()

    expect(screen.getByRole("tab", { name: /Poranna \(120 pkt\)/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Wieczorna \(90 pkt\)/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Weekendowa \(60 pkt\)/i })).toBeInTheDocument()
  })

  it("displays inactive messaging and greyed-out tasks when selecting upcoming routine", async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole("tab", { name: /Wieczorna/i }))

    expect(screen.getByText("Ta rutyna jest teraz nieaktywna. Będzie dostępna o 19:00.")).toBeInTheDocument()
    const taskList = screen.getByRole("list", { name: /zadania rutyny/i })
    const tasks = within(taskList).getAllByRole("listitem")
    tasks.forEach((task) => {
      expect(task).toHaveAttribute("data-inactive", "true")
    })
    expect(screen.queryByRole("button", { name: /Zakończ rutynę/i })).not.toBeInTheDocument()
  })

  it("locks other tabs while the active routine is in progress", async () => {
    const user = userEvent.setup()
    const tabs = buildTabs([
      { isInProgress: true },
      { isLocked: true },
      {},
    ])

    render(<ChildRoutineTabs tabs={tabs} />)

    const upcomingTab = screen.getByRole("tab", { name: /Wieczorna \(90 pkt\)/i })
    expect(upcomingTab).toHaveAttribute("aria-disabled", "true")

    await user.click(upcomingTab)

    const activeTab = screen.getByRole("tab", { name: /Poranna \(120 pkt\)/i })
    expect(activeTab).toHaveAttribute("aria-selected", "true")
  })

  it("allows completing tasks and finishing the active routine", async () => {
    const user = userEvent.setup()
    renderTabs()

    const getActiveTaskButton = () =>
      screen.getAllByRole("button", { name: "Zrobione" }).find((button) => !button.hasAttribute("disabled"))

    const firstTaskButton = getActiveTaskButton()
    expect(firstTaskButton).toBeDefined()
    await user.click(firstTaskButton!)

    const secondTaskButton = getActiveTaskButton()
    expect(secondTaskButton).toBeDefined()
    await user.click(secondTaskButton!)

    const finishButton = screen.getByRole("button", { name: /Zakończ rutynę/i })
    expect(finishButton).toBeEnabled()

    await user.click(finishButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/sessions/session-morning/complete",
        expect.objectContaining({
          method: "POST",
        })
      )
      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      const payload = JSON.parse((options.body ?? "{}") as string)
      expect(payload.completedTasks).toHaveLength(2)
      expect(pushMock).toHaveBeenCalledWith("/child/routines/session-morning/success")
    })
  })

  it("shows completion summary for a completed routine tab", async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole("tab", { name: /Weekendowa/i }))

    expect(screen.getByText(/Ostatnio ukończono 2 godziny temu/)).toBeInTheDocument()
    expect(screen.getByText("Porządki w pokoju")).toBeInTheDocument()
    const completionTasks = screen.getAllByRole("listitem", { name: /zadanie ukończone/i })
    expect(completionTasks).toHaveLength(2)
    expect(screen.getByRole("button", { name: /Przejdź dalej/i })).toBeEnabled()
  })
})
