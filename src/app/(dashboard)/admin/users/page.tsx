'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllProfiles, updateProfile, deleteProfile } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Eye, Ban, CheckCircle, Trash2, Shield, MoreHorizontal,
  ChevronLeft, ChevronRight, UserCog, Users, Filter, Mail, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserRole = 'admin' | 'supplier' | 'user' | 'buyer';

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  supplierStatus?: string;
  createdAt: string;
  phone?: string;
  locale?: string;
  avatar_url?: string;
  company_name?: string;
  category?: string;
  badge?: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminUsers() {
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ id: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProfiles() as unknown as ProfileData[];
      setUsers(data);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, []);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const hasFetched = React.useRef(false);
  React.useEffect(() => {
    if (isAdmin && !hasFetched.current) {
      hasFetched.current = true;
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const loading = authLoading;

  const filtered = users.filter((u) => {
    const matchSearch =
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'supplier' && u.role === 'supplier') ||
      (statusFilter === 'buyer' && (u.role === 'user' || u.role === 'buyer'));
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-[#1B3A5C] text-white text-xs">مسؤول</Badge>;
      case 'supplier': return <Badge className="bg-emerald-100 text-emerald-700 text-xs">مورد</Badge>;
      case 'user': case 'buyer': return <Badge className="bg-gray-100 text-gray-700 text-xs">مشتري</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    }
  };

  const getStatusBadge = (role: string, supplierStatus?: string) => {
    if (role !== 'supplier') return <Badge className="bg-gray-100 text-gray-500 text-xs">-</Badge>;
    switch (supplierStatus) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 text-xs">نشط</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 text-xs">مرفوض</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 text-xs">معلق</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-500 text-xs">-</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    toast.success('تم حذف المستخدم بنجاح');
    setDeleteDialog(null);
    setSelectedUser(null);
    loadUsers();
  };

  const handleRoleChange = async () => {
    if (!roleChangeDialog) return;
    const res = await updateProfile(roleChangeDialog.id, { role: newRole as 'admin' | 'supplier' | 'user' });
    if (res) {
      toast.success('تم تغيير الدور بنجاح');
      setRoleChangeDialog(null);
      loadUsers();
    } else {
      toast.error('فشل في تغيير الدور');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full border-b" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1B3A5C]" />
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-gray-500">{filtered.length} مستخدم</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مسؤول</SelectItem>
                <SelectItem value="supplier">مورد</SelectItem>
                <SelectItem value="buyer">مشتري</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="supplier">الموردون</SelectItem>
                <SelectItem value="buyer">المشترون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">الاسم</TableHead>
                  <TableHead className="text-xs font-semibold">البريد الإلكتروني</TableHead>
                  <TableHead className="text-xs font-semibold">الدور</TableHead>
                  <TableHead className="text-xs font-semibold">الحالة</TableHead>
                  <TableHead className="text-xs font-semibold">تاريخ الانضمام</TableHead>
                  <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">لا يوجد مستخدمون</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((user, idx) => (
                    <TableRow key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {(user.displayName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                            <p className="text-[11px] text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600" dir="ltr">{user.email}</span>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.role)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="w-4 h-4 ml-2" /> عرض الملف
                            </DropdownMenuItem>
                            {user.role !== 'admin' && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setRoleChangeDialog({ id: user.id, currentRole: user.role });
                                  setNewRole(user.role);
                                }}>
                                  <UserCog className="w-4 h-4 ml-2" /> تغيير الدور
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setDeleteDialog(user.id)}
                                >
                                  <Trash2 className="w-4 h-4 ml-2" /> حذف
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            عرض {(page - 1) * ITEMS_PER_PAGE + 1} إلى {Math.min(page * ITEMS_PER_PAGE, filtered.length)} من {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
            <DialogDescription>معلومات حساب المستخدم</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-xl font-bold">
                  {(selectedUser.displayName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.displayName}</p>
                  <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate" dir="ltr">{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(selectedUser.createdAt)}
                </div>
                {selectedUser.company_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{selectedUser.company_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={!!roleChangeDialog} onOpenChange={() => setRoleChangeDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تغيير دور المستخدم</DialogTitle>
            <DialogDescription>اختر الدور الجديد للمستخدم</DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buyer">مشتري</SelectItem>
              <SelectItem value="supplier">مورد</SelectItem>
              <SelectItem value="admin">مسؤول</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeDialog(null)}>إلغاء</Button>
            <Button onClick={handleRoleChange}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المستخدم نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
