import {
  signInWithDiscord,
  signInWithGoogle,
  signOut,
} from "@/lib/community/actions";

export function SignInButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form action={signInWithGoogle}>
        <button type="submit" className="btn-gold h-11 px-4 text-sm font-semibold">
          Continue with Google
        </button>
      </form>
      <form action={signInWithDiscord}>
        <button
          type="submit"
          className="h-11 border border-line px-4 text-sm font-semibold hover:border-gold"
        >
          Continue with Discord
        </button>
      </form>
    </div>
  );
}

export function SignOutButton({ name }: { name: string }) {
  return (
    <form action={signOut} className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted">
        Signed in as <span className="text-text">{name}</span>
      </p>
      <button
        type="submit"
        className="h-11 border border-line px-4 text-sm font-semibold hover:border-gold"
      >
        Sign out
      </button>
    </form>
  );
}
