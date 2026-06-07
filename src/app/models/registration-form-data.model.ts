export interface RegistrationFormData {
  id?: number;
  fullName?: string;
  dob?: string;
  phone?: string;
  email?: string;
  aadhaar?: string;
  scholarIn?: string;
  sakai: string;
  emergencyContact?: string;
  ownAccount?: boolean;
  accountHolderRelationship?: string;
  accountHolderName?: string;
  accountNumber?: string;
  address?: string;
  city?: string;
  ifscCode?: string;
  branchName?: string;
  bankName?: string;
  accountType?: string;
  registrationDate?: string;
  giftGiven?: boolean;
  travelCharge?: number;
  sambavanai?: number;
  totalAmount?: number;
  day1FnAttendance?: boolean;
  day1AnAttendance?: boolean;
  day2FnAttendance?: boolean;
  day2AnAttendance?: boolean;
  day3FnAttendance?: boolean;
  day3AnAttendance?: boolean;
  day4FnAttendance?: boolean;
  day4AnAttendance?: boolean;
  day5FnAttendance?: boolean;
  day5AnAttendance?: boolean;
  accommodation?: string;
  passbookImageBase64?: string;
  passbookImageContentType?: string;
}

export interface Registration {
  id: number;
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  aadhaar: string;
  scholarIn: string;
  sakai: string;
  emergencyContact: string;
  ownAccount: boolean;
  accountHolderRelationship: string | null;
  accountHolderName: string | null;
  accountNumber: string;
  address: string;
  city: string;
  ifscCode: string;
  branchName: string;
  bankName: string;
  accountType: string;
  registrationDate: string;
  hasPassbookImage?: boolean;
  passbookImageBase64?: string;
  passbookImageContentType?: string;
}

export interface AttendanceAndGifts {
  id?: number;
  qrCodeIdentifier?: string;
  giftGiven?: boolean;
  sambavanai?: number;
  travelCharge?: number;
  totalAmount?: number;
  day1FnAttendance?: boolean;
  day1AnAttendance?: boolean;
  day2FnAttendance?: boolean;
  day2AnAttendance?: boolean;
  day3FnAttendance?: boolean;
  day3AnAttendance?: boolean;
  day4FnAttendance?: boolean;
  day4AnAttendance?: boolean;
  day5FnAttendance?: boolean;
  day5AnAttendance?: boolean;
  createdAt?: string;
  updatedAt?: string;
  registration?: Registration;
  totalAttendance?: number;
  accommodation?: string;
}
export interface RegistrationResponse {
  registration: Registration;
  attendanceAndGifts?: AttendanceAndGifts;
}

/**
 * Generic Page interface to represent Spring Data paginated responses
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type RegistrationListResponse = Page<RegistrationResponse>;

export type AttendanceData = {
  day1FnAttendance?: boolean;
  day1AnAttendance?: boolean;
  day2FnAttendance?: boolean;
  day2AnAttendance?: boolean;
  day3FnAttendance?: boolean;
  day3AnAttendance?: boolean;
  day4FnAttendance?: boolean;
  day4AnAttendance?: boolean;
  day5FnAttendance?: boolean;
  day5AnAttendance?: boolean;
};

export interface AttendanceStatsDTO {
  day1FnCount: number;
  day1AnCount: number;
  day2FnCount: number;
  day2AnCount: number;
  day3FnCount: number;
  day3AnCount: number;
  day4FnCount: number;
  day4AnCount: number;
  day5FnCount: number;
  day5AnCount: number;
}

export interface ScholarStatsDTO {
  groupedStats: {
    [vedaKey: string]: {
      [shakaKey: string]: number;
    };
  };
}
