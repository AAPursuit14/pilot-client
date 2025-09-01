// Attendance utility functions

/**
 * Parses a time string (HH:MM or HH:MM:SS) into a Date on the reference date.
 * If an ISO string is provided, it returns a Date for that timestamp.
 */
export function toDateOnReference(refDate, timeOrIso) {
  if (!timeOrIso) return null;
  // ISO / RFC timestamp
  const isoDate = new Date(timeOrIso);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Time string on same day as reference
  const [h, m, s] = String(timeOrIso).split(":");
  const hours = parseInt(h, 10);
  const minutes = parseInt(m || "0", 10);
  const seconds = parseInt(s || "0", 10);
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), hours, minutes, seconds, 0);
  return d;
}

/**
 * Calculates late arrival minutes given a scheduled start and an actual check-in time.
 * Both inputs may be ISO strings or HH:MM[:SS]. Returns 0 if on-time or early.
 */
export function calculateLateArrivalMinutes(scheduledStart, actualCheckIn, referenceDate = new Date()) {
  const scheduled = toDateOnReference(referenceDate, scheduledStart);
  const actual = toDateOnReference(referenceDate, actualCheckIn);
  if (!scheduled || !actual) return 0;
  const diffMs = actual.getTime() - scheduled.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / 60000);
}

/**
 * Returns a normalized attendance status given late minutes and a grace period
 */
export function getAttendanceStatus(lateMinutes, gracePeriodMinutes = 5) {
  if (lateMinutes <= gracePeriodMinutes) return 'on_time';
  return 'late';
}

/**
 * Summarize a list of members into attendance totals using scheduled start.
 * members: [{ checkInTime }]
 */
export function summarizeAttendance(members, scheduledStart, gracePeriodMinutes = 5, referenceDate = new Date()) {
  const summary = { total: 0, present: 0, onTime: 0, late: 0 };
  if (!Array.isArray(members)) return summary;
  summary.total = members.length;
  members.forEach((m) => {
    if (m && m.checkInTime) {
      summary.present += 1;
      const late = calculateLateArrivalMinutes(scheduledStart, m.checkInTime, referenceDate);
      const status = getAttendanceStatus(late, gracePeriodMinutes);
      if (status === 'late') summary.late += 1; else summary.onTime += 1;
    }
  });
  return summary;
}

/**
 * Groups members by cohort and returns an array with cohort-level summaries.
 */
export function groupAttendanceByCohort(members, scheduledStart, gracePeriodMinutes = 5, referenceDate = new Date()) {
  const byCohort = new Map();
  (members || []).forEach((m) => {
    const cohortName = m?.cohort || 'Unassigned';
    if (!byCohort.has(cohortName)) byCohort.set(cohortName, []);
    byCohort.get(cohortName).push(m);
  });
  const result = [];
  byCohort.forEach((list, cohortName) => {
    const summary = summarizeAttendance(list, scheduledStart, gracePeriodMinutes, referenceDate);
    result.push({ name: cohortName, members: list, ...summary });
  });
  // Sort cohorts by name for stable display
  result.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return result;
}

