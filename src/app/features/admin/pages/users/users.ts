import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserService } from '../../../../core/services/user';
import { RoleService } from '../../../../core/services/role';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { NotificationService } from '../../../../core/services/notification';
import { UserResponse, UserRequest } from '../../../../core/models/user';
import { RoleResponse } from '../../../../core/models/role';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit, OnDestroy {
  // inyecciones
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);

  private routerSub: Subscription | null = null;

  // filtros 
  allUsers: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  roles: RoleResponse[] = [];

  // defaults para paginacion
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'createdAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  includeInactive: boolean = false;

  // busqueda
  searchTerm = '';

  // flags
  loading = true;
  saving = false;

  isModalOpen = false;
  isEditMode = false;
  editingUser: UserResponse | null = null;
  showPassword = false;
  modalError: string | null = null;

  // form del user
  userForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
    roleId: [null, [Validators.required]]
  });


  // carga de usuarios y paramatros
  ngOnInit(): void {
    this.loadRoles();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openCreateModal();
      }
    });

    // carga de los usaurios
    this.loadUsers();

    // recargar la ruta para los datos
    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/admin/users')) {
          if (!initialNavDone) {
            // siempre es la carga inicial
            initialNavDone = true;
          } else {
            this.loadUsers();
          }
        } else {
          // al salir se debe de recargar otra vez
          initialNavDone = false;
        }
      });
  }

  // destruccion del objeto
  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  // carga de los roles y default
  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res.data) {
          this.roles = res.data;
        }
      },
      error: () => {
        this.roles = [
          { id: 1, name: 'ADMINISTRATION', description: 'Administración' },
          { id: 2, name: 'PURCHASING', description: 'Compras' },
          { id: 3, name: 'INVENTORY', description: 'Inventario' },
          { id: 4, name: 'SALES', description: 'Ventas' }
        ];
      }
    });
  }

  // carga de los usuarios
  loadUsers(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);

    const cached = this.userService.getCachedUsers(
      pageIndex,
      this.pageSize,
      this.sortField,
      this.sortOrder,
      this.includeInactive
    );

    if (cached && cached.content && cached.content.length > 0) {
      this.allUsers = cached.content;
      this.filteredUsers = [...cached.content];
      this.totalElements = cached.totalElements ?? cached.content.length;
      this.totalPages = Math.max(1, cached.totalPages ?? 1);
      const pageNum = (cached as any).number ?? cached.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.loading = false;
      this.applyFilter();
    } else {
      this.loading = true;
    }

    this.userService
      .getUsers(
        pageIndex,
        this.pageSize,
        this.sortField,
        this.sortOrder,
        this.includeInactive
      )
      .subscribe({
        next: (res) => {
          console.log('USUARIOS RESPUESTA:', res);

          if (res?.data) {
            const content = res.data.content || [];

            this.allUsers = content;
            this.filteredUsers = [...content];

            this.totalElements =
              res.data.totalElements ?? content.length;

            this.totalPages = Math.max(
              1,
              res.data.totalPages ?? 1
            );

            const pageNum =
              (res.data as any).number ??
              res.data.pageNumber ??
              pageIndex;

            this.currentPage = pageNum + 1;
            this.applyFilter();
          } else {
            this.allUsers = [];
            this.filteredUsers = [];
            this.totalElements = 0;
            this.totalPages = 1;
          }

          this.loading = false;
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('ERROR CARGANDO USUARIOS:', err);

          this.loading = false;
          this.cdr.detectChanges();
          if (this.allUsers.length === 0) {
            this.allUsers = [];
            this.filteredUsers = [];
            this.totalElements = 0;
            this.totalPages = 1;
          }
        }
      });
  }

  // paginacion
  get pagesArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // filtros de paginacion
  onSortFieldChange(newField: string): void {
    this.sortField = newField;
    this.currentPage = 1;
    this.loadUsers();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadUsers();
  }

  onIncludeInactiveChange(include: boolean): void {
    this.includeInactive = include;
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.allUsers];
    } else {
      this.filteredUsers = this.allUsers.filter(user => {
        const nameMatch = user.fullName?.toLowerCase().includes(term) ?? false;
        const usernameMatch = user.username?.toLowerCase().includes(term) ?? false;
        const emailMatch = user.email?.toLowerCase().includes(term) ?? false;
        const employeeNumberMatch = user.employeeNumber?.toString().includes(term) ?? false;
        const roleMatch = (user.role?.name?.toLowerCase().includes(term) || user.role?.description?.toLowerCase().includes(term)) ?? false;

        return nameMatch || usernameMatch || emailMatch || employeeNumberMatch || roleMatch;
      });
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingUser = null;
    this.showPassword = false;
    this.modalError = null;
    this.userForm.reset();

    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.get('password')?.updateValueAndValidity();

    if (this.roles.length > 0) {
      this.userForm.patchValue({ roleId: this.roles[0].id });
    }

    this.isModalOpen = true;
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.editingUser = user;
    this.showPassword = false;
    this.modalError = null;

    this.userForm.get('password')?.setValidators([Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.userForm.patchValue({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      roleId: user.role?.id || null
    });

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingUser = null;
    this.modalError = null;
    this.userForm.reset();

    if (this.route.snapshot.queryParams['action']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // guardar el usuario, filtros
  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.modalError = null;
    const formVal = this.userForm.value;
    const payload: UserRequest = {
      fullName: formVal.fullName.trim(),
      email: formVal.email.trim(),
      roleId: Number(formVal.roleId)
    };

    if (formVal.password && formVal.password.trim().length > 0) {
      payload.password = formVal.password.trim();
    }

    this.saving = true;

    if (this.isEditMode && this.editingUser?.id) {
      if (!payload.password) {
        payload.password = 'password123';
      }

      const targetId = this.editingUser.id;

      this.userService.updateUser(targetId, payload).subscribe({
        next: () => {
          this.saving = false;
          const index = this.allUsers.findIndex(u => u.id === targetId);
          if (index !== -1) {
            const updated = { ...this.allUsers[index] };
            updated.fullName = payload.fullName;
            updated.email = payload.email;
            const selRole = this.roles.find(r => r.id === payload.roleId);
            if (selRole) {
              updated.role = selRole;
            }
            this.allUsers[index] = updated;
            this.applyFilter();
          }
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          const msg = extractHttpErrorMessage(err);
          this.modalError = msg;
          this.cdr.detectChanges();
        }
      });
    } else {
      if (!payload.password) {
        this.saving = false;
        this.notificationService.showError('La contraseña es requerida para nuevos usuarios', 'Validación');
        return;
      }

      this.userService.createUser(payload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.data) {
            this.allUsers = [res.data, ...this.allUsers];
            this.totalElements++;
            this.applyFilter();
          }
          this.closeModal();
          this.currentPage = 1;
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          const msg = extractHttpErrorMessage(err);
          this.modalError = msg;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // eliminacion soft delete
  toggleUserStatus(user: UserResponse): void {
    if (!user.id) return;

    if (user.isActive) {
      if (confirm(`¿Está seguro de desactivar al usuario "${user.fullName}"?`)) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            user.isActive = false;
            this.applyFilter();
            this.loadUsers();
          },
          error: () => {}
        });
      }
    } else {
      const payload: UserRequest = {
        fullName: user.fullName || '',
        email: user.email || '',
        password: 'password123',
        roleId: user.role?.id || 1
      };
      this.userService.updateUser(user.id, payload).subscribe({
        next: () => {
          user.isActive = true;
          this.applyFilter();
          this.loadUsers();
        },
        error: () => {}
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getRoleBadgeClass(roleName?: string): string {
    switch (roleName) {
      case 'ADMINISTRATION': return 'badge-role-admin';
      case 'PURCHASING': return 'badge-role-purchasing';
      case 'INVENTORY': return 'badge-role-inventory';
      case 'SALES': return 'badge-role-sales';
      default: return 'badge-role-default';
    }
  }

  getRoleLabel(roleName?: string): string {
    switch (roleName) {
      case 'ADMINISTRATION': return 'Administración';
      case 'PURCHASING': return 'Compras';
      case 'INVENTORY': return 'Inventario';
      case 'SALES': return 'Ventas';
      default: return roleName || 'N/A';
    }
  }
}
