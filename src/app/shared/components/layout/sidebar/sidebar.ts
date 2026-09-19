export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface RoleMenuConfig {
  showActionBtn?: boolean;
  actionBtnLabel?: string;
  actionBtnRoute?: string;
  sections: MenuSection[];
}

// configuracion de los menus para cada rol
export const ROLE_MENUS: Record<string, RoleMenuConfig> = {
  // elementos para la admistracion
  ADMINISTRATION: {
    showActionBtn: true,
    actionBtnLabel: 'Nuevo Usuario',
    actionBtnRoute: '/admin/users',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/admin/dashboard' }
        ]
      },
      {
        title: 'USUARIOS Y ROLES',
        items: [
          { label: 'Usuarios', icon: 'users', route: '/admin/users' },
          { label: 'Roles', icon: 'user-gear', route: '/admin/roles' },
          { label: 'Auditoría', icon: 'shield', route: '/admin/audit-logs' }
        ]
      },
      {
        title: 'CATÁLOGOS & COMERCIAL',
        items: [
          { label: 'Productos', icon: 'box', route: '/admin/products' },
          { label: 'Categorías', icon: 'shapes', route: '/admin/categories' },
          { label: 'Métodos de Pago', icon: 'receipt', route: '/admin/payment-methods' },
          { label: 'Clientes', icon: 'users', route: '/admin/customers' }
        ]
      },
      {
        title: 'OPERACIONES',
        items: [
          { label: 'Proveedores', icon: 'truck', route: '/admin/suppliers' },
          { label: 'Compras', icon: 'cart', route: '/admin/purchases' },
          { label: 'Ventas', icon: 'receipt', route: '/admin/sales' }
        ]
      },
      {
        title: 'INVENTARIO',
        items: [
          { label: 'Existencias', icon: 'box', route: '/admin/inventory/stock' },
          { label: 'Movimientos / Kardex', icon: 'receipt', route: '/admin/inventory/movements' },
          { label: 'Lotes de Entrada', icon: 'warehouse', route: '/admin/inventory/lots' }
        ]
      },
      {
        title: 'CUENTA',
        items: [
          { label: 'Mi Perfil', icon: 'user', route: '/admin/profile' }
        ]
      }
    ]
  },

  // elementos para el de compras
  PURCHASING: {
    showActionBtn: true,
    actionBtnLabel: 'Nueva Compra',
    actionBtnRoute: '/purchasing/purchases',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/purchasing/dashboard' }
        ]
      },
      {
        title: 'COMPRAS & ABASTECIMIENTO',
        items: [
          { label: 'Compras', icon: 'cart', route: '/purchasing/purchases' },
          { label: 'Proveedores', icon: 'truck', route: '/purchasing/providers' },
          { label: 'Catálogo & Productos', icon: 'box', route: '/purchasing/products' },
          { label: 'Mi Perfil', icon: 'user', route: '/purchasing/profile' }
        ]
      }
    ]
  },

  // elementos para el de inventario
  INVENTORY: {
    showActionBtn: true,
    actionBtnLabel: 'Ajustar Stock',
    actionBtnRoute: '/inventory/stock',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/inventory/dashboard' }
        ]
      },
      {
        title: 'INVENTARIO',
        items: [
          { label: 'Stock & Ajustes', icon: 'box', route: '/inventory/stock' },
          { label: 'Kardex / Movimientos', icon: 'receipt', route: '/inventory/movements' },
          { label: 'Lotes de Entrada', icon: 'warehouse', route: '/inventory/lots' },
          { label: 'Productos & Precios', icon: 'box', route: '/inventory/products' },
          { label: 'Categorías', icon: 'shapes', route: '/inventory/categories' },
          { label: 'Mi Perfil', icon: 'user', route: '/inventory/profile' }
        ]
      }
    ]
  },

  // inventario para los vendedores
  SALES: {
    showActionBtn: true,
    actionBtnLabel: 'Nueva Venta',
    actionBtnRoute: '/sales/sales',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/sales/dashboard' }
        ]
      },
      {
        title: 'VENTAS',
        items: [
          { label: 'Ventas & Facturas', icon: 'receipt', route: '/sales/sales' },
          { label: 'Clientes', icon: 'users', route: '/sales/clients' },
          { label: 'Mi Perfil', icon: 'user', route: '/sales/profile' }
        ]
      }
    ]
  }
};