export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected' | 'unconfigured';
    aiProvider: string;
  };
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
