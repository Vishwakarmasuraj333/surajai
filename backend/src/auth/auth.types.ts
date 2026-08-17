import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
}
