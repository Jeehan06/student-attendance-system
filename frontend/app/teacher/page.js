"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const request = async (path) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  useEffect(() => {
    if (localStorage.getItem("role") !== "TEACHER") {
      window.location.href = "/";
      return;
    }

    request("/api/teacher/classes")
      .then((data) => setClasses(data.classes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const viewSubmissions = async (classSession) => {
    setError("");
    setSelectedClass(classSession);
    setSubmissions([]);

    try {
      const data = await request(
        `/api/teacher/classes/${classSession.id}/submissions`
      );
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="mt-2 text-zinc-400">
              View department classes and student attendance submissions.
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-4 py-2 hover:bg-zinc-800"
          >
            Sign out
          </button>
        </header>

        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-400">Loading classes...</p>
        ) : classes.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
            No classes are currently available for your department.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {classes.map((classSession) => (
              <article
                key={classSession.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
              >
                <h2 className="text-lg font-semibold">
                  {classSession.subject?.name || "Class session"}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Date: {classSession.date || "Not specified"}
                </p>
                <p className="text-sm text-zinc-400">
                  Time: {classSession.startTime || "—"} –{" "}
                  {classSession.endTime || "—"}
                </p>
                <button
                  onClick={() => viewSubmissions(classSession)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700"
                >
                  View submissions
                </button>
              </article>
            ))}
          </section>
        )}

        {selectedClass && (
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold">
              Attendance submissions
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {selectedClass.subject?.name || "Selected class"}
            </p>

            {submissions.length === 0 ? (
              <p className="mt-5 text-zinc-400">
                No submissions found for this class.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-700 text-zinc-400">
                    <tr>
                      <th className="px-3 py-3">Student ID</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr
                        key={submission.id}
                        className="border-b border-zinc-800"
                      >
                        <td className="px-3 py-3">{submission.studentId}</td>
                        <td className="px-3 py-3">{submission.status}</td>
                        <td className="px-3 py-3">
                          {submission.createdAt
                            ? new Date(submission.createdAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}