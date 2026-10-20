"use client";

import { useState } from "react";

const API_URL = "http://localhost:3000";

export default function Home() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const isRegister = mode === "register";
      const endpoint = isRegister
        ? role === "TEACHER"
          ? "/api/auth/register/teacher"
          : "/api/auth/register"
        : "/api/auth/login";

      const body = isRegister
        ? {
            name,
            email,
            password,
            ...(role === "STUDENT"
              ? { course, department, semester: Number(semester) }
              : { department }),
          }
        : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (isRegister) {
        setSuccess(data.message || "Registration submitted successfully.");
        setMode("login");
        setPassword("");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "ADMIN") {
        window.location.href = "/admin";
      } else if (data.user.role === "TEACHER") {
        window.location.href = "/teacher";
      } else {
        window.location.href = "/student";
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">
            College Portal
          </h1>
          <p className="mt-2 text-zinc-400">
            {isRegister ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl"
        >
          <div className="space-y-5">
            {isRegister && (
              <>
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Register as
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Full name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={1}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                    placeholder="Your full name"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                placeholder="you@college.edu"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
              />
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Department
                  </label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                    placeholder="e.g. Computer Science"
                  />
                </div>

                {role === "STUDENT" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm text-zinc-300">
                        Course
                      </label>
                      <input
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        required
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                        placeholder="e.g. B.Tech CSE"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-300">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Semester {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Submit Registration"
                  : "Sign In"}
            </button>

            <p className="text-center text-sm text-zinc-400">
              {isRegister ? "Already registered?" : "New to the portal?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(isRegister ? "login" : "register");
                  setError("");
                  setSuccess("");
                }}
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                {isRegister ? "Sign in" : "Create account"}
              </button>
            </p>

            {isRegister && (
              <p className="text-center text-xs text-zinc-500">
                Your account must be approved by an administrator before you can sign in.
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}