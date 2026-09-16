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
        title: 'ADMINISTRACIÓN',
        items: [
          { label: 'Usuarios', icon: 'users', route: '/admin/users' },
          { label: 'Roles', icon: 'user-gear', route: '/admin/roles' }
        ]
      }
    ]
  },

  // elementos para el de compras
  PURCHASING: {
    showActionBtn: true,
    actionBtnLabel: 'Nueva Compra',
    actionBtnRoute: '/purchasing/new-purchase',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/purchasing/dashboard' }
        ]
      },
      {
        title: 'COMPRAS',
        items: [
          { label: 'Compras', icon: 'cart', route: '/purchasing/purchases' },
          { label: 'Proveedores', icon: 'truck', route: '/purchasing/providers' }
        ]
      }
    ]
  },

  // elementos para el de inventario
  INVENTORY: {
    showActionBtn: true,
    actionBtnLabel: 'Nuevo Producto',
    actionBtnRoute: '/inventory/new-product',
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
          { label: 'Productos', icon: 'box', route: '/inventory/products' },
          { label: 'Categorías', icon: 'shapes', route: '/inventory/categories' }
        ]
      }
    ]
  },

  // inventario para los vendedores
  SALES: {
    showActionBtn: true,
    actionBtnLabel: 'Nueva Venta',
    actionBtnRoute: '/sales/new-sale',
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
          { label: 'Ventas', icon: 'receipt', route: '/sales/sales' },
          { label: 'Clientes', icon: 'users', route: '/sales/clients' }
        ]
      }
    ]
  }
};