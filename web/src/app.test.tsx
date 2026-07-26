import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "@/app"

describe("campus map app", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "")
  })

  it("shows the map fallback when an API key is not configured", () => {
    render(<App />)

    expect(screen.getByText("Google Maps is not configured.")).toBeInTheDocument()
  })

  it("preserves the show-all search behavior and opens amenity details", async () => {
    const user = userEvent.setup()
    render(<App />)
    const drawer = document.querySelector('[data-slot="drawer-popup"]')

    expect(drawer).not.toHaveAttribute("data-expanded")

    await user.type(screen.getByRole("searchbox"), "restroom")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getAllByRole("button", { name: /Floor/ })).toHaveLength(10)

    await user.click(screen.getAllByRole("button", { name: /Restroom.*Soda Hall.*Floor 1/ })[0])

    expect(screen.getByRole("heading", { name: "Restroom" })).toBeInTheDocument()
    expect(screen.getByText("Last reported 10 minutes ago")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByRole("searchbox")).toHaveValue("restroom")
    expect(screen.getAllByRole("button", { name: /Floor/ })).toHaveLength(10)
  })

  it("opens top-level drawer views and keeps the drawer open", async () => {
    const user = userEvent.setup()
    render(<App />)
    const drawer = document.querySelector('[data-slot="drawer-popup"]')

    expect(drawer).toHaveAttribute("data-snap-points", "")
    expect(drawer).not.toHaveAttribute("data-expanded")

    await user.click(screen.getByRole("button", { name: "Create" }))
    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByRole("heading", { name: "Add an amenity" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("x.tao@berkeley.edu")

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

    expect(screen.getByRole("status")).toHaveTextContent("Email saved for this session.")

    await user.click(screen.getByRole("button", { name: "Back" }))
    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("new.user@berkeley.edu")
  })

  it("shows a useful message when Google Maps rejects the key", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    render(<App />)

    expect(window.gm_authFailure).toBeTypeOf("function")
    act(() => window.gm_authFailure?.())

    expect(screen.getByText("Google Maps could not be authorized.")).toBeInTheDocument()
  })
})
