"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [classesResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_URL}/api/student/classes`, { headers }),
        fetch(`${API_URL}/api/student/attendance`, { headers }),
      ]);

      const classesData = await classesResponse.json();
      const attendanceData = await attendanceResponse.json();

      if (!classesResponse.ok) {
        throw new Error(classesData.message || "Failed to load classes");
      }

      if (!attendanceResponse.ok) {
        throw new Error(
          attendanceData.message || "Failed to load attendance"
        );
      }

      setClasses(classesData.classes || []);
      setAttendance(attendanceData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    loadDashboard();
  }, []);

  const submitAttendance = async (classId, status) => {
    const token = localStorage.getItem("token");

    setSubmitting(classId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/student/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit attendance");
      }

      setMessage(`Attendance submitted as ${status}.`);

      await loadDashboard();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>

            {user && (
              <p className="mt-1 text-sm text-zinc-400">
                Welcome, {user.name}
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-green-400">
            {message}
          </div>
        )}

        {attendance && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">
              Attendance Overview
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Total Classes</p>
                <p className="mt-2 text-3xl font-bold">
                  {attendance.summary.totalClasses}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Present</p>
                <p className="mt-2 text-3xl font-bold text-green-400">
                  {attendance.summary.presentClasses}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Absent</p>
                <p className="mt-2 text-3xl font-bold text-red-400">
                  {attendance.summary.absentClasses}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Percentage</p>
                <p className="mt-2 text-3xl font-bold text-blue-400">
                  {attendance.summary.percentage}%
                </p>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Assigned Classes
          </h2>

          {classes.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
              No classes assigned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classSession) => {
                const submission =
                  classSession.submissions &&
                  classSession.submissions.length > 0
                    ? classSession.submissions[0]
                    : null;

                return (
                  <div
                    key={classSession.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {classSession.subject?.name || "Subject"}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400">
                          {classSession.date}
                        </p>

                        <p className="text-sm text-zinc-400">
                          {classSession.startTime} - {classSession.endTime}
                        </p>
                      </div>

                      <div className="flex items-center">
                        {submission ? (
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-medium ${
                              submission.status === "PRESENT"
                                ? "bg-green-950 text-green-400"
                                : "bg-red-950 text-red-400"
                            }`}
                          >
                            Submitted: {submission.status}
                          </span>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                submitAttendance(
                                  classSession.id,
                                  "PRESENT"
                                )
                              }
                              disabled={submitting === classSession.id}
                              className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {submitting === classSession.id
                                ? "Submitting..."
                                : "Present"}
                            </button>

                            <button
                              onClick={() =>
                                submitAttendance(
                                  classSession.id,
                                  "ABSENT"
                                )
                              }
                              disabled={submitting === classSession.id}
                              className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Absent
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}