export type ErrorLevel = "INFO" | "WARNING" | "ERROR";

export interface ErrorRecord {
  id: string;
  message: string;
  level: ErrorLevel;
  application: string;
  module: string;
  description: string;
  timestamp: string;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  info: number;
  warning: number;
  error: number;
}

export interface CategoryCount {
  level: ErrorLevel;
  count: number;
}

export interface TopError {
  message: string;
  level: ErrorLevel;
  occurrences: number;
  application: string;
  last_seen: string;
}

export interface RecentActivity {
  id: string;
  message: string;
  level: ErrorLevel;
  application: string;
  timestamp: string;
}
