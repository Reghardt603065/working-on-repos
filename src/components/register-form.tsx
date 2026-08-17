"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    if (form.get("password") !== form.get("confirm")) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      skills: String(form.get("skills") || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error || "Registration failed.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error && (
        <div className="form-message error">
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="name">
          Full name
        </label>

        <input
          className="input"
          id="name"
          name="name"
          required
          minLength={2}
        />
      </div>

      <div className="field">
        <label htmlFor="email">
          Email address
        </label>

        <input
          className="input"
          id="email"
          name="email"
          type="email"
          required
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="password">
            Password
          </label>

          <input
            className="input"
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="confirm">
            Confirm password
          </label>

          <input
            className="input"
            id="confirm"
            name="confirm"
            type="password"
            minLength={8}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="skills">
          Primary skills
        </label>

        <input
          className="input"
          id="skills"
          name="skills"
          placeholder="JavaScript, SQL, React"
        />

        <span className="helper">
          Separate skills with commas.
        </span>
      </div>

      <button
        className="btn btn-primary"
        disabled={loading}
      >
        {loading
          ? "Creating account…"
          : "Create account"}
      </button>
    </form>
  );
}