"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error && <div className="form-message error">{error}</div>}

      <div className="field">
        <label htmlFor="email">Email address</label>

        <input
          className="input"
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email address"
          required
          autoComplete="email"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>

        <input
          className="input"
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}