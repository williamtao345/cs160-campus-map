import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "@/app"
import { restrooms } from "@/data/restrooms"

describe("campus map app", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "")
  })

  it("shows the map fallback when an API key is not configured", () => {
    render(<App />)

    expect(screen.getByText("Google Maps is not configured.")).toBeInTheDocument()
  })

  it("searches building names case-insensitively and opens restroom details", async () => {
    const user = userEvent.setup()
    render(<App />)
    const drawer = document.querySelector('[data-slot="drawer-popup"]')

    expect(drawer).not.toHaveAttribute("data-expanded")

    await user.type(screen.getByRole("searchbox"), "cOrY ReStRoOm")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByText("Showing 10 of 10 results.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /restroom.*Cory Hall/i })).toHaveLength(10)

    await user.click(screen.getByRole("button", { name: /Women's restroom.*Cory Hall.*Floor 1.*Room 112/i }))

    expect(screen.getByRole("heading", { name: "Women's restroom" })).toBeInTheDocument()
    expect(screen.getByText("Cory Hall")).toBeInTheDocument()
    expect(screen.getByText("Room number")).toBeInTheDocument()
    expect(screen.getByText("112")).toBeInTheDocument()
    expect(screen.getByText("Floor")).toBeInTheDocument()
    expect(screen.getByText("Accessibility")).toBeInTheDocument()
    expect(screen.getByText("Accessible")).toBeInTheDocument()
    expect(screen.getByText("General campus access")).toBeInTheDocument()
    expect(screen.queryByText("Stall type")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByRole("searchbox")).toHaveValue("cOrY ReStRoOm")
    expect(screen.getAllByRole("button", { name: /restroom.*Cory Hall/i })).toHaveLength(10)
  })

  it("searches short building names and limits broad generic results", async () => {
    const user = userEvent.setup()
    render(<App />)
    const searchbox = screen.getByRole("searchbox")

    await user.type(searchbox, "MLK bathroom")
    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(screen.getAllByRole("button", { name: /restroom.*Martin Luther King Junior Student Union/i }).length).toBeGreaterThan(0)

    await user.clear(searchbox)
    await user.type(searchbox, "bathroom")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(screen.getByText("Showing 50 of 1,025 results.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /restroom/i })).toHaveLength(50)
  })

  it("shows availability status instead of accessibility on search results", async () => {
    const user = userEvent.setup()
    const sampleRestrooms = restrooms.slice(0, 3)
    const originalStatuses = sampleRestrooms.map((restroom) => restroom.isAvailable)

    try {
      sampleRestrooms[0].isAvailable = true
      sampleRestrooms[1].isAvailable = false
      sampleRestrooms[2].isAvailable = null

      render(<App />)
      await user.type(screen.getByRole("searchbox"), "bathroom")
      await user.click(screen.getByRole("button", { name: "Search" }))

      expect(screen.getByText("Available")).toHaveClass("text-green-800")
      expect(screen.getByText("Out of service")).toHaveClass("text-destructive")
      expect(screen.queryByText("Unknown")).not.toBeInTheDocument()
      expect(screen.queryByText(/^Accessible$/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Not accessible$/)).not.toBeInTheDocument()
    } finally {
      sampleRestrooms.forEach((restroom, index) => {
        restroom.isAvailable = originalStatuses[index]
      })
    }
  })

  it("does not search bathroom locations and reports no building matches", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole("searchbox"), "N658A")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(screen.getByText("No restrooms found for this building.")).toBeInTheDocument()
  })

  it("opens top-level drawer views and keeps the drawer open", async () => {
    const user = userEvent.setup()
    render(<App />)
    const drawer = document.querySelector('[data-slot="drawer-popup"]')

    expect(drawer).toHaveAttribute("data-snap-points", "")
    expect(drawer).not.toHaveAttribute("data-expanded")

    await user.click(screen.getByRole("button", { name: "Add Amenity" }))
    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByRole("heading", { name: "Add an amenity" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("x.tao@berkeley.edu")
    expect(screen.getByRole("combobox", { name: "Gender" })).toBeInTheDocument()
    expect(screen.queryByText("This email is stored for this session only.")).not.toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
  })

  it("validates and saves the email for the current session", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Settings" }))
    const emailInput = screen.getByRole("textbox", { name: "Email" })
    const saveButton = screen.getByRole("button", { name: "Save" })

    expect(saveButton).toBeDisabled()

    await user.clear(emailInput)
    await user.type(emailInput, "not-an-email")
    expect(emailInput).toHaveAttribute("aria-invalid", "true")
    expect(saveButton).toBeDisabled()

    await user.clear(emailInput)
    await user.type(emailInput, "new.user@berkeley.edu")
    expect(saveButton).toBeEnabled()
    await user.click(saveButton)

    expect(screen.getByRole("status")).toHaveTextContent("Settings saved for this session.")

    await user.click(screen.getByRole("button", { name: "Back" }))
    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("new.user@berkeley.edu")
  })

  it("saves the selected gender for the current session", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("combobox", { name: "Gender" }))
    await user.click(screen.getByRole("option", { name: "Non-binary" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await user.click(screen.getByRole("button", { name: "Back" }))
    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("combobox", { name: "Gender" })).toHaveTextContent("Non-binary")
    await user.click(screen.getByRole("button", { name: "Back" }))

    await user.type(screen.getByRole("searchbox"), "Cory Hall")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(screen.getAllByRole("button", { name: /restroom.*Cory Hall/i })[0]).toHaveAccessibleName(/^Gender-inclusive restroom/)
  })

  it("shows a useful message when Google Maps rejects the key", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    render(<App />)

    expect(window.gm_authFailure).toBeTypeOf("function")
    act(() => window.gm_authFailure?.())

    expect(screen.getByText("Google Maps could not be authorized.")).toBeInTheDocument()
  })
})
