
"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

export default function AdminDashboard() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [issues, setIssues] = useState([]);

  const [attendance, setAttendance] = useState({});
  const [attendanceUploaded, setAttendanceUploaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [classesRes, issuesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/classes`, { headers }),
        fetch(`${API_URL}/api/admin/attendance/issues`, { headers }),
      ]);

      const classesData = await classesRes.json();
      const issuesData = await issuesRes.json();

      if (!classesRes.ok) {
        throw new Error(
          classesData.message || "Failed to load classes"
        );
      }

      if (!issuesRes.ok) {
        throw new Error(
          issuesData.message || "Failed to load issues"
        );
      }

      setClasses(classesData.classes || []);
      setIssues(issuesData.issues || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
      window.location.href = "/";
      return;
    }

    loadData();
  }, []);

  const openAttendanceSheet = async (classSession) => {
    const token = localStorage.getItem("token");

    try {
      setSheetLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/classes/${classSession.id}/attendance-sheet`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load attendance sheet"
        );
      }

      setSelectedClass(data.class);
      setStudents(data.students || []);
      setAttendanceUploaded(data.uploaded || false);

      const initialAttendance = {};

      for (const student of data.students || []) {
        const submission = student.submissions
          ? student.submissions[0]
          : null;

        if (submission) {
          initialAttendance[student.id] = submission.status;
        } else {
          initialAttendance[student.id] = "";
        }
      }

      setAttendance(initialAttendance);
    } catch (err) {
      setError(err.message);
    } finally {
      setSheetLoading(false);
    }
  };

  const changeAttendance = (studentId, status) => {
    if (attendanceUploaded) {
      return;
    }

    setAttendance((current) => ({
      ...current,
      [studentId]: status,
    }));
  };

  const uploadAttendance = async () => {
    if (!selectedClass) {
      return;
    }

    if (attendanceUploaded) {
      setError("Attendance has already been uploaded for this class.");
      return;
    }

    const token = localStorage.getItem("token");

    const missingStudents = students.filter(
      (student) => !attendance[student.id]
    );

    if (missingStudents.length > 0) {
      setError(
        `Please select PRESENT or ABSENT for all students. ${missingStudents.length} student(s) still need a status.`
      );
      return;
    }

    const attendanceList = students.map((student) => ({
      studentId: student.id,
      status: attendance[student.id],
    }));

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/classes/${selectedClass.id}/attendance-sheet/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attendance: attendanceList,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload attendance"
        );
      }

      setMessage(
        `Attendance uploaded successfully for ${data.count} students.`
      );

      await openAttendanceSheet(selectedClass);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const resolveIssue = async (
    issueId,
    status,
    correctedStatus = null
  ) => {
    const token = localStorage.getItem("token");

    try {
      setError("");
      setMessage("");

      const body = {
        status,
        adminResponse:
          status === "APPROVED"
            ? "Attendance corrected after review."
            : "Attendance issue rejected after review.",
      };

      if (status === "APPROVED") {
        body.correctedStatus = correctedStatus;
      }

      const response = await fetch(
        `${API_URL}/api/admin/attendance/issues/${issueId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to resolve issue"
        );
      }

      setMessage(data.message);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Loading admin dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            <p className="text-sm text-zinc-400">
              Review and upload class attendance
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-4 py-2 hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-800 bg-green-950/50 p-4 text-green-400">
            {message}
          </div>
        )}

        <section>
          <h2 className="mb-4 text-xl font-semibold">Classes</h2>

          {classes.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
              No classes found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classSession) => (
                <div
                  key={classSession.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  <h3 className="text-lg font-semibold">
                    {classSession.subject?.name || "Unknown Subject"}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    Course: {classSession.subject?.course}
                  </p>

                  <p className="text-sm text-zinc-400">
                    Semester: {classSession.subject?.semester}
                  </p>

                  <p className="mt-2 text-sm">
                    Date: {classSession.date}
                  </p>

                  <p className="text-sm text-zinc-400">
                    Time: {classSession.startTime} -{" "}
                    {classSession.endTime}
                  </p>

                  <button
                    onClick={() =>
                      openAttendanceSheet(classSession)
                    }
                    className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
                  >
                    Review Attendance
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {sheetLoading && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            Loading attendance sheet...
          </section>
        )}

        {selectedClass && !sheetLoading && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  Attendance Sheet
                </h2>

                <p className="mt-1 text-zinc-400">
                  {selectedClass.subject?.name} — {selectedClass.date}
                </p>

                <p className="text-sm text-zinc-500">
                  {selectedClass.subject?.course} · Semester{" "}
                  {selectedClass.subject?.semester}
                </p>
              </div>

              <button
                onClick={uploadAttendance}
                disabled={uploading || attendanceUploaded}
                className={`rounded-lg px-5 py-3 font-semibold ${
                  attendanceUploaded
                    ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {uploading
                  ? "Uploading..."
                  : attendanceUploaded
                  ? "Attendance Already Uploaded"
                  : "Upload Attendance to DB"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">
                      Student Submission
                    </th>
                    <th className="px-4 py-3">
                      Final Attendance
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student, index) => {
                    const submission = student.submissions
                      ? student.submissions[0]
                      : null;

                    const currentStatus = attendance[student.id];

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-zinc-800"
                      >
                        <td className="px-4 py-4 text-zinc-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4 font-medium">
                          {student.user?.name || "Unknown Student"}
                        </td>

                        <td className="px-4 py-4 text-sm text-zinc-400">
                          {student.user?.email}
                        </td>

                        <td className="px-4 py-4">
                          {submission ? (
                            <span
                              className={
                                submission.status === "PRESENT"
                                  ? "font-semibold text-green-400"
                                  : "font-semibold text-red-400"
                              }
                            >
                              {submission.status}
                            </span>
                          ) : (
                            <span className="text-yellow-400">
                              NOT SUBMITTED
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                changeAttendance(
                                  student.id,
                                  "PRESENT"
                                )
                              }
                              disabled={attendanceUploaded}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                                currentStatus === "PRESENT"
                                  ? "bg-green-600 text-white"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              Present
                            </button>

                            <button
                              onClick={() =>
                                changeAttendance(
                                  student.id,
                                  "ABSENT"
                                )
                              }
                              disabled={attendanceUploaded}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                                currentStatus === "ABSENT"
                                  ? "bg-red-600 text-white"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm">
              <p>
                <span className="text-zinc-400">Total Students:</span>{" "}
                {students.length}
              </p>

              <p>
                <span className="text-zinc-400">Present:</span>{" "}
                {
                  Object.values(attendance).filter(
                    (status) => status === "PRESENT"
                  ).length
                }
              </p>

              <p>
                <span className="text-zinc-400">Absent:</span>{" "}
                {
                  Object.values(attendance).filter(
                    (status) => status === "ABSENT"
                  ).length
                }
              </p>

              <p>
                <span className="text-zinc-400">Remaining:</span>{" "}
                {
                  students.filter(
                    (student) => !attendance[student.id]
                  ).length
                }
              </p>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Attendance Issues
          </h2>

          {issues.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
              No attendance issues.
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h3 className="font-semibold">
                        {issue.student?.user?.name || "Unknown Student"}
                      </h3>

                      <p className="mt-2 text-zinc-300">
                        {issue.message}
                      </p>

                      <p className="mt-2 text-sm text-zinc-400">
                        Status: {issue.status}
                      </p>

                      <p className="text-sm text-zinc-400">
                        Attendance: {issue.attendance?.status}
                      </p>

                      <p className="text-sm text-zinc-400">
                        Subject:{" "}
                        {issue.attendance?.class?.subject?.name ||
                          "Unknown Subject"}
                      </p>

                      <p className="text-sm text-zinc-400">
                        Date:{" "}
                        {issue.attendance?.class?.date || "Unknown"}
                      </p>
                    </div>

                    {issue.status === "PENDING" && (
                      <div className="flex flex-col gap-2 md:min-w-48">
                        <button
                          onClick={() =>
                            resolveIssue(
                              issue.id,
                              "APPROVED",
                              "PRESENT"
                            )
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-700"
                        >
                          Correct to Present
                        </button>

                        <button
                          onClick={() =>
                            resolveIssue(
                              issue.id,
                              "APPROVED",
                              "ABSENT"
                            )
                          }
                          className="rounded-lg bg-yellow-600 px-4 py-2 font-semibold hover:bg-yellow-700"
                        >
                          Correct to Absent
                        </button>

                        <button
                          onClick={() =>
                            resolveIssue(issue.id, "REJECTED")
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
                        >
                          Reject Issue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

