export interface RoleResponse { 
    id?: number;
    name?: RoleResponse.NameEnum;
    description?: string;
}
export namespace RoleResponse {
    export const NameEnum = {
        Administration: 'ADMINISTRATION',
        Purchasing: 'PURCHASING',
        Inventory: 'INVENTORY',
        Sales: 'SALES',
    } as const;
    export type NameEnum = typeof NameEnum[keyof typeof NameEnum];
}
