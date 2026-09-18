import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to Signallog" },
      {
        name: "description",
        content:
          "Sign in or create a Signallog account to publish verified startup milestones and follow founders building in public.",
      },
      { property: "og:title", content: "Sign in to Signallog" },
      { property: "og:description", content: "Publish verified startup milestones." },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  displayName: z.string().trim().min(2, "Tell us your name").max(60).optional(),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentialsSchema.safeParse({
      email,
      password,
      displayName: isSignup ? displayName : undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          toast.success("Check your email to confirm your account");
          return;
        }
        toast.success("Welcome to Signallog");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (error) {
      toast.error((error as Error).message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <div className="glass-strong rounded-2xl p-7">
          {checkEmail ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold">Confirm your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it and you'll land straight in your
                dashboard.
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => setCheckEmail(false)}>
                Back
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold">
                {isSignup ? "Create your founder account" : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSignup
                  ? "Claim a startup page and start posting verified milestones."
                  : "Sign in to manage your startups and milestones."}
              </p>

              <Button variant="outline" className="mt-6 w-full" onClick={() => void google()}>
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={submit}>
                {isSignup ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Maya Okonjo"
                      maxLength={60}
                    />
                    {errors.displayName ? (
                      <p className="text-xs text-destructive">{errors.displayName}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@startup.com"
                    maxLength={255}
                  />
                  {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                  />
                  {errors.password ? (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  ) : null}
                </div>
                <Button type="submit" variant="signal" className="w-full" disabled={busy}>
                  {busy ? "Working…" : isSignup ? "Create account" : "Sign in"}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                {isSignup ? "Already have an account?" : "New to Signallog?"}{" "}
                <button
                  type="button"
                  className="font-medium text-signal"
                  onClick={() => {
                    setIsSignup((value) => !value);
                    setErrors({});
                  }}
                >
                  {isSignup ? "Sign in" : "Create one"}
                </button>
              </p>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/explore" className="hover:text-foreground">
            Browse startups without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
