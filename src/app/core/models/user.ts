import { RoleResponse } from "./role";

export interface UserRequest {
    fullName: string;
    password?: string;
    email: string;
    roleId: number;
}

export interface UserResponse {
    id?: string;
    employeeNumber?: number;
    username?: string;
    fullName?: string;
    email?: string;
    role?: RoleResponse;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}