// src/components/accounting/AccountTable.tsx
import { useEffect, useState } from "react";
import type { Account } from "../../types/accounting";
import { listAccounts } from "../../api/accounting";
import { useAuth } from "../../store/auth";

type Props = {
  onEdit?: (a: Account) => void;
  onDelete?: (a: Account) => void;
};

export default function AccountTable({ onEdit, onDelete }: Props) {
  const { hasRole } = useAuth();
  const canWrite = hasRole("superadmin", "admin_cabang");

  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAccounts({ per_page: 500 });
        if (!mounted) return;
        setRows(res.data);
      } catch {
        setError("Gagal memuat akun.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const empty = !loading && rows.length === 0;

  if (loading) return <div className="alert">Loading COA…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (empty) return <div className="alert">Belum ada akun.</div>;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama</th>
            <th className="text-center">Tipe</th>
            <th className="text-center">Saldo Normal</th>
            <th className="text-center">Aktif</th>
            <th className="text-right" aria-label="Aksi" />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{a.code}</td>
              <td>{a.name}</td>
              <td className="text-center">{a.type}</td>
              <td className="text-center">{a.normal_balance}</td>
              <td className="text-center">{a.is_active ? "Ya" : "Tidak"}</td>
              <td className="text-right">
                <div className="table-actions">
                  <button
                    className="button"
                    onClick={() => onEdit?.(a)}
                    disabled={!canWrite}
                    aria-disabled={!canWrite}
                    title={canWrite ? "Edit akun" : "Hanya-baca"}
                  >
                    Edit
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => onDelete?.(a)}
                    disabled={!canWrite}
                    aria-disabled={!canWrite}
                    title={canWrite ? "Hapus akun" : "Hanya-baca"}
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
