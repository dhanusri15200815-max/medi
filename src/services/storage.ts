import { SimplificationResult, DoctorInquiry } from '../types';

const REPORTS_KEY = 'medclarity_reports';
const CURRENT_REPORT_KEY = 'medclarity_current_report';
const INQUIRIES_KEY = 'medclarity_doctor_inquiries';

export function getSavedReports(): SimplificationResult[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCurrentReport(): SimplificationResult | null {
  try {
    const raw = localStorage.getItem(CURRENT_REPORT_KEY);
    if (raw) return JSON.parse(raw);
    const reports = getSavedReports();
    return reports.length > 0 ? reports[0] : null;
  } catch {
    return null;
  }
}

export function saveReport(report: SimplificationResult): void {
  const reports = getSavedReports();
  const index = reports.findIndex(r => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(report));
}

export function setCurrentReport(report: SimplificationResult | null): void {
  if (report) {
    localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(report));
  } else {
    localStorage.removeItem(CURRENT_REPORT_KEY);
  }
}

export function getDoctorInquiries(): DoctorInquiry[] {
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDoctorInquiry(inquiry: DoctorInquiry): void {
  const list = getDoctorInquiries();
  list.unshift(inquiry);
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(list));
}
