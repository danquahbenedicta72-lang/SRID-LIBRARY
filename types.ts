export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'VIEWER';

export type StudentStatus = 'ACTIVE' | 'DROPPED';

export interface Student {
  refNo: string;
  name: string;
  year: string;
  programme: string;
  contact: string;
  hall: string;
  status: StudentStatus;
}

export interface AttendanceRecord {
  id: string;
  studentRef: string;
  checkIn: string;
  checkOut: string | null;
  date: string;
  purpose?: string;
  // Enriched fields from student
  name?: string;
  year?: string;
  programme?: string;
  hall?: string;
}