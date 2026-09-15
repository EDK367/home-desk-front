export interface LoginRequest {
    usernameOrEmail: string,
    password: string
}

export interface UserSummaryResponse {
    id: string;
    employeeNumber: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
}

export interface LoginResponse {
    accessToken: string,
    refreshToken: string,
    expirationSeconds: number,
    refreshExpirationSeconds: number,
    user: UserSummaryResponse
}

export interface LogoutRequest { 
    /**
     * Refresh token de la sesión a revocar
     */
    refreshToken?: string;
}

export interface RefreshTokenRequest { 
    refreshToken: string;
}
