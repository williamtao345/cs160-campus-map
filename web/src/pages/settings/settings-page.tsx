import { useRef, useState } from "react"
import type { FormEvent } from "react"
import { LogInIcon, LogOutIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FormSelect } from "@/components/forms/form-select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { AuthUser } from "@/lib/auth"

function userInitials(user: AuthUser) {
  const nameInitials = user.displayName?.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2)
  return nameInitials?.toLocaleUpperCase() || user.email?.[0]?.toLocaleUpperCase() || "U"
}

export function SettingsPage({
  authError,
  authUser,
  gender,
  isAuthLoading,
  isAuthPending,
  onSave,
  onSignIn,
  onSignOut,
}: {
  authError: string
  authUser: AuthUser | null
  gender: string
  isAuthLoading: boolean
  isAuthPending: boolean
  onSave: (gender: string) => void
  onSignIn: () => void
  onSignOut: () => void
}) {
  const [draftGender, setDraftGender] = useState(gender)
  const [success, setSuccess] = useState(false)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const hasChanges = draftGender !== gender

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges) return

    onSave(draftGender)
    setSuccess(true)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  return (
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="font-heading text-xl font-medium">Settings</h2>

      <div className="mt-5 flex flex-col gap-3">
        {isAuthLoading ? (
          <p role="status" className="text-sm text-muted-foreground">Checking sign-in...</p>
        ) : authUser ? (
          <div className="flex items-center gap-3">
            <Avatar>
              {authUser.photoURL && <AvatarImage src={authUser.photoURL} alt="" referrerPolicy="no-referrer" />}
              <AvatarFallback>{userInitials(authUser)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{authUser.displayName ?? "Google user"}</p>
              {authUser.email && <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>}
            </div>
            <Button type="button" variant="outline" disabled={isAuthPending} onClick={onSignOut}>
              <LogOutIcon data-icon="inline-start" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">Sign in securely through Google.</p>
            <Button type="button" disabled={isAuthPending} onClick={onSignIn}>
              <LogInIcon data-icon="inline-start" aria-hidden="true" />
              {isAuthPending ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        )}
        {authError && <p role="alert" className="text-sm text-destructive">{authError}</p>}
      </div>

      <Separator className="mt-5" />

      <form className="mt-5 space-y-4" onSubmit={saveSettings}>
        <FormSelect
          id="settings-gender"
          label="Gender"
          placeholder="Select gender"
          options={["Woman", "Man", "Non-binary", "Prefer not to say"]}
          value={draftGender}
          onValueChange={(value) => {
            setDraftGender(value)
            setSuccess(false)
          }}
        />
        <Button type="submit" disabled={!hasChanges}>Save preferences</Button>
      </form>
      {success && (
        <p ref={statusRef} role="status" tabIndex={-1} className="mt-4 rounded-lg bg-secondary p-3 text-sm font-medium">
          Settings saved for this session.
        </p>
      )}
    </section>
  )
}
