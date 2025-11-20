// src/pages/customers/CustomersIndex.tsx
import { useNavigate } from 'react-router-dom';
import CustomerTable from '../../components/customers/CustomerTable';
import { useAuth } from '../../store/auth';
import { createCustomer } from '../../api/customers';
import { useState } from 'react';
import type { Customer } from '../../types/customers';

export default function CustomersIndex() {
  const nav = useNavigate();
  const { hasRole } = useAuth();
  const canCreate =
    hasRole('superadmin') ||
    hasRole('admin_cabang') ||
    hasRole('kasir') ||
    hasRole('sales');

  const [version, setVersion] = useState<number>(0);

  async function handleCreate() {
    const nameInput = window.prompt('Customer name?')?.trim();
    if (!nameInput) return;

    const phone = window.prompt('Phone (e.g. 08xxxxxxxxxx)?')?.trim();
    if (!phone) return;

    try {
      // sesuai tipe saat ini (CustomerUpsertPayload pakai "nama")
      const c = await createCustomer({ nama: nameInput, phone });
      setVersion((v) => v + 1); // refresh table by remount
      nav(`/customers/${c.id}`);
    } catch (err: unknown) {
      let msg = 'Failed to create customer';
      if (typeof err === 'object' && err !== null) {
        // @ts-expect-error akses opsional, tetap tanpa any
        msg = err?.response?.data?.message ?? (err as Error).message ?? msg;
      }
      alert(msg);
    }
  }

  return (
    <div className="section p-4">
      <h1>Customers</h1>
      <div className="mt-4">
        <CustomerTable
          key={version}
          canCreate={canCreate}
          onCreate={handleCreate}
          onRowClick={(c: Customer) => nav(`/customers/${c.id}`)}
        />
      </div>
    </div>
  );
}
