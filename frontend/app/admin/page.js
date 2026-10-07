"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

export default function AdminDashboard() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [issues, setIssues] = useState([]);

  const [attendance, setAttendance] = useState({});
  const [attendanceUploaded, setAttendanceUploaded] = useState(false);

  const [classForm, setClassForm] = useState({
    subjectId: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [creatingClass, setCreatingClass] = useState(false);
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

      const [classesRes, issuesRes, subjectsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/classes`, { headers }),
        fetch(`${API_URL}/api/admin/attendance/issues`, { headers }),
        fetch(`${API_URL}/api/admin/subjects`, { headers }),
      ]);

      const classesData = await classesRes.json();
      const issuesData = await issuesRes.json();
      const subjectsData = await subjectsRes.json();

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

      if (!subjectsRes.ok) {
        throw new Error(
          subjectsData.message || "Failed to load subjects"
        );
      }

      setClasses(classesData.classes || []);
      setIssues(issuesData.issues || []);
      setSubjects(subjectsData.subjects || []);
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

  const handleClassFormChange = (event) => {
    const { name, value } = event.target;

    setClassForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const createClass = async (event) => {
    event.preventDefault();

    if (
      !classForm.subjectId ||
      !classForm.date ||
      !classForm.startTime ||
      !classForm.endTime
    ) {
      setError("Please fill in all class details.");
      setMessage("");
      return;
    }

    if (classForm.endTime <= classForm.startTime) {
      setError("End time must be after start time.");
      setMessage("");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setCreatingClass(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/api/admin/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: Number(classForm.subjectId),
          date: classForm.date,
          startTime: classForm.startTime,
          endTime: classForm.endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create class"
        );
      }

      setMessage("Class created successfully.");

      setClassForm({
        subjectId: "",
        date: "",
        startTime: "",
        endTime: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingClass(false);
    }
  };

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
      setMessage("");
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

  const pendingIssues = issues.filter(
    (issue) => issue.status === "PENDING"
  ).length;

  const uploadedClasses = classes.filter(
    (classSession) => classSession.attendanceUploaded
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#ffe1dd] border-t-[#ff6b5f]" />
          <p className="font-semibold text-[#202522]">
            Loading dashboard...
          </p>
          <p className="mt-1 text-sm text-[#777b79]">
            Please wait a moment
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] text-[#202522]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#eee5e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202522] text-lg font-black text-white shadow-sm">
              A
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight">
                Attendify
              </h1>

              <p className="text-xs font-medium text-[#777b79]">
                Admin Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-[#eee5e2] bg-white px-4 py-2.5 text-sm font-bold text-[#202522] shadow-sm hover:border-[#ff6b5f] hover:bg-[#fff0ed] hover:text-[#ef5a4f]"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* HERO */}
        <section className="mb-8 overflow-hidden rounded-[28px] bg-[#202522] p-7 text-white shadow-lg sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[#ff6b5f] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Administration
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Manage attendance
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#c8cdca]">
                Create class sessions, review student submissions,
                upload official attendance, and resolve attendance issues.
              </p>
            </div>

            <div className="hidden h-24 w-24 items-center justify-center rounded-full bg-[#ff6b5f] md:flex">
              <span className="text-4xl font-black">✓</span>
            </div>
          </div>
        </section>

        {/* ALERTS */}
        <div className="mb-8 space-y-3">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#ffd1cd] bg-[#fff0ed] p-4 text-sm font-medium text-[#c44740]">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff6b5f] font-bold text-white">
                !
              </span>

              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#cdebdc] bg-[#eaf7f0] p-4 text-sm font-medium text-[#317a55]">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3f9b6d] font-bold text-white">
                ✓
              </span>

              <p>{message}</p>
            </div>
          )}
        </div>

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#eee5e2] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#777b79]">
                Total Classes
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ed] text-lg">
                📚
              </span>
            </div>

            <p className="text-3xl font-black">{classes.length}</p>

            <p className="mt-1 text-xs text-[#999e9b]">
              Created class sessions
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee5e2] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#777b79]">
                Subjects
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ed] text-lg">
                📖
              </span>
            </div>

            <p className="text-3xl font-black">{subjects.length}</p>

            <p className="mt-1 text-xs text-[#999e9b]">
              Available subjects
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee5e2] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#777b79]">
                Attendance
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7f0] text-lg">
                ✓
              </span>
            </div>

            <p className="text-3xl font-black">{uploadedClasses}</p>

            <p className="mt-1 text-xs text-[#999e9b]">
              Uploaded classes
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee5e2] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#777b79]">
                Open Issues
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7e8] text-lg">
                !
              </span>
            </div>

            <p className="text-3xl font-black">{pendingIssues}</p>

            <p className="mt-1 text-xs text-[#999e9b]">
              Require your attention
            </p>
          </div>
        </section>

        {/* CREATE CLASS */}
        <section className="mb-8 rounded-[24px] border border-[#eee5e2] bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b5f] font-bold text-white">
                +
              </div>

              <h2 className="text-xl font-black">
                Create New Class
              </h2>
            </div>

            <p className="text-sm text-[#777b79]">
              Create a class session for an existing subject.
            </p>
          </div>

          <form
            onSubmit={createClass}
            className="grid gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-[#343a37]">
                Subject
              </label>

              <select
                name="subjectId"
                value={classForm.subjectId}
                onChange={handleClassFormChange}
                className="form-input"
              >
                <option value="">Select a subject</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} — {subject.course} · Semester{" "}
                    {subject.semester}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#343a37]">
                Date
              </label>

              <input
                type="date"
                name="date"
                value={classForm.date}
                onChange={handleClassFormChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#343a37]">
                Start Time
              </label>

              <input
                type="time"
                name="startTime"
                value={classForm.startTime}
                onChange={handleClassFormChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#343a37]">
                End Time
              </label>

              <input
                type="time"
                name="endTime"
                value={classForm.endTime}
                onChange={handleClassFormChange}
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creatingClass}
                className="primary-button w-full sm:w-auto"
              >
                {creatingClass ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="text-lg">+</span>
                    Create Class
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* CLASSES */}
        <section className="mb-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                Classes
              </h2>

              <p className="mt-1 text-sm text-[#777b79]">
                Review and manage attendance for your class sessions.
              </p>
            </div>

            <span className="hidden rounded-full bg-[#202522] px-3 py-1.5 text-xs font-bold text-white sm:block">
              {classes.length} total
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#ddd3d0] bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ed] text-2xl">
                📚
              </div>

              <h3 className="font-black">
                No classes yet
              </h3>

              <p className="mt-1 text-sm text-[#777b79]">
                Create your first class session above.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classSession) => (
                <div
                  key={classSession.id}
                  className="card-hover overflow-hidden rounded-[22px] border border-[#eee5e2] bg-white shadow-sm"
                >
                  <div className="h-2 bg-[#ff6b5f]" />

                  <div className="p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">
                          {classSession.subject?.name ||
                            "Unknown Subject"}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-[#777b79]">
                          {classSession.subject?.course} · Semester{" "}
                          {classSession.subject?.semester}
                        </p>
                      </div>

                      <span className="rounded-lg bg-[#fff0ed] px-2.5 py-1 text-xs font-bold text-[#ef5a4f]">
                        #{classSession.id}
                      </span>
                    </div>

                    <div className="space-y-2 rounded-xl bg-[#fffaf8] p-4 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-[#777b79]">Date</span>
                        <span className="font-bold">
                          {classSession.date}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-[#777b79]">Time</span>
                        <span className="font-bold">
                          {classSession.startTime} -{" "}
                          {classSession.endTime}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        openAttendanceSheet(classSession)
                      }
                      className="primary-button mt-4 w-full"
                    >
                      Review Attendance
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SHEET LOADING */}
        {sheetLoading && (
          <section className="mb-8 rounded-[24px] border border-[#eee5e2] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#ffe1dd] border-t-[#ff6b5f]" />

            <p className="font-bold">
              Loading attendance sheet...
            </p>

            <p className="mt-1 text-sm text-[#777b79]">
              Preparing the class roster
            </p>
          </section>
        )}

        {/* ATTENDANCE SHEET */}
        {selectedClass && !sheetLoading && (
          <section className="mb-8 overflow-hidden rounded-[24px] border border-[#eee5e2] bg-white shadow-sm">
            <div className="border-b border-[#eee5e2] bg-[#202522] p-6 text-white sm:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-2 inline-flex rounded-full bg-[#ff6b5f] px-3 py-1 text-xs font-bold">
                    Attendance Review
                  </div>

                  <h2 className="text-2xl font-black">
                    {selectedClass.subject?.name}
                  </h2>

                  <p className="mt-1 text-sm text-[#c8cdca]">
                    {selectedClass.subject?.course} · Semester{" "}
                    {selectedClass.subject?.semester}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {selectedClass.date} ·{" "}
                    {selectedClass.startTime} -{" "}
                    {selectedClass.endTime}
                  </p>
                </div>

                <button
                  onClick={uploadAttendance}
                  disabled={uploading || attendanceUploaded}
                  className={`rounded-xl px-5 py-3 font-bold transition ${
                    attendanceUploaded
                      ? "cursor-not-allowed bg-[#343a37] text-[#8d9490]"
                      : "bg-[#ff6b5f] text-white shadow-lg shadow-[#ff6b5f]/20 hover:bg-[#ef5a4f]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {uploading
                    ? "Uploading..."
                    : attendanceUploaded
                    ? "✓ Attendance Uploaded"
                    : "Upload Attendance to DB"}
                </button>
              </div>
            </div>

            {/* ATTENDANCE SUMMARY */}
            <div className="grid border-b border-[#eee5e2] sm:grid-cols-4">
              <div className="border-b border-[#eee5e2] p-5 sm:border-b-0 sm:border-r">
                <p className="text-xs font-bold uppercase tracking-wide text-[#999e9b]">
                  Total
                </p>
                <p className="mt-1 text-2xl font-black">
                  {students.length}
                </p>
              </div>

              <div className="border-b border-[#eee5e2] p-5 sm:border-b-0 sm:border-r">
                <p className="text-xs font-bold uppercase tracking-wide text-[#999e9b]">
                  Present
                </p>
                <p className="mt-1 text-2xl font-black text-[#3f9b6d]">
                  {
                    Object.values(attendance).filter(
                      (status) => status === "PRESENT"
                    ).length
                  }
                </p>
              </div>

              <div className="border-b border-[#eee5e2] p-5 sm:border-b-0 sm:border-r">
                <p className="text-xs font-bold uppercase tracking-wide text-[#999e9b]">
                  Absent
                </p>
                <p className="mt-1 text-2xl font-black text-[#d9534f]">
                  {
                    Object.values(attendance).filter(
                      (status) => status === "ABSENT"
                    ).length
                  }
                </p>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#999e9b]">
                  Remaining
                </p>
                <p className="mt-1 text-2xl font-black text-[#d99a35]">
                  {
                    students.filter(
                      (student) => !attendance[student.id]
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-[#eee5e2] bg-[#fffaf8] text-left text-xs font-bold uppercase tracking-wide text-[#777b79]">
                    <th className="px-5 py-4">#</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">
                      Student Submission
                    </th>
                    <th className="px-5 py-4">
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
                        className="border-b border-[#f0eae7] last:border-b-0 hover:bg-[#fffaf8]"
                      >
                        <td className="px-5 py-4 text-sm font-bold text-[#999e9b]">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {student.user?.name ||
                              "Unknown Student"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#777b79]">
                          {student.user?.email}
                        </td>

                        <td className="px-5 py-4">
                          {submission ? (
                            <span
                              className={
                                submission.status === "PRESENT"
                                  ? "status-present"
                                  : "status-absent"
                              }
                            >
                              {submission.status}
                            </span>
                          ) : (
                            <span className="status-pending">
                              NOT SUBMITTED
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                changeAttendance(
                                  student.id,
                                  "PRESENT"
                                )
                              }
                              disabled={attendanceUploaded}
                              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                                currentStatus === "PRESENT"
                                  ? "bg-[#3f9b6d] text-white shadow-sm"
                                  : "border border-[#d8e9df] bg-[#eaf7f0] text-[#317a55] hover:bg-[#dff1e7]"
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
                              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                                currentStatus === "ABSENT"
                                  ? "bg-[#d9534f] text-white shadow-sm"
                                  : "border border-[#f1d4d2] bg-[#fff0ef] text-[#c44740] hover:bg-[#ffe5e3]"
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
          </section>
        )}

        {/* ATTENDANCE ISSUES */}
        <section className="pb-10">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7e8] font-black text-[#d99a35]">
                !
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Attendance Issues
                </h2>

                <p className="mt-1 text-sm text-[#777b79]">
                  Review and resolve student attendance reports.
                </p>
              </div>
            </div>
          </div>

          {issues.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#ddd3d0] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7f0] text-xl text-[#3f9b6d]">
                ✓
              </div>

              <h3 className="font-black">
                No attendance issues
              </h3>

              <p className="mt-1 text-sm text-[#777b79]">
                Everything looks good right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-[22px] border border-[#eee5e2] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {issue.student?.user?.name ||
                            "Unknown Student"}
                        </h3>

                        <span
                          className={
                            issue.status === "PENDING"
                              ? "status-pending"
                              : issue.status === "APPROVED"
                              ? "status-present"
                              : "status-absent"
                          }
                        >
                          {issue.status}
                        </span>
                      </div>

                      <div className="rounded-xl bg-[#fffaf8] p-4">
                        <p className="text-sm leading-6 text-[#343a37]">
                          {issue.message}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <p>
                          <span className="text-[#999e9b]">
                            Attendance:
                          </span>{" "}
                          <span className="font-bold">
                            {issue.attendance?.status}
                          </span>
                        </p>

                        <p>
                          <span className="text-[#999e9b]">
                            Subject:
                          </span>{" "}
                          <span className="font-bold">
                            {issue.attendance?.class?.subject?.name ||
                              "Unknown Subject"}
                          </span>
                        </p>

                        <p>
                          <span className="text-[#999e9b]">
                            Date:
                          </span>{" "}
                          <span className="font-bold">
                            {issue.attendance?.class?.date ||
                              "Unknown"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {issue.status === "PENDING" && (
                      <div className="flex shrink-0 flex-col gap-2 lg:min-w-52">
                        <button
                          onClick={() =>
                            resolveIssue(
                              issue.id,
                              "APPROVED",
                              "PRESENT"
                            )
                          }
                          className="rounded-xl bg-[#3f9b6d] px-4 py-3 text-sm font-bold text-white hover:brightness-95"
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
                          className="rounded-xl bg-[#d99a35] px-4 py-3 text-sm font-bold text-white hover:brightness-95"
                        >
                          Correct to Absent
                        </button>

                        <button
                          onClick={() =>
                            resolveIssue(issue.id, "REJECTED")
                          }
                          className="rounded-xl border border-[#f1d4d2] bg-[#fff0ef] px-4 py-3 text-sm font-bold text-[#c44740] hover:bg-[#ffe5e3]"
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