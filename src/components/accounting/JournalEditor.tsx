// src/components/accounting/JournalEditor.tsx
import { useMemo } from "react";
import type { JournalLine, ID } from "../../types/accounting";

type Props = {
  lines: JournalLine[];
  onChange: (lines: JournalLine[]) => void;
  accounts: { id: ID; code: string; name: string }[];
  readOnly?: boolean;
};

export default function JournalEditor({ lines, onChange, accounts, readOnly = false }: Props) {
  const totals = useMemo(() => {
    const d = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const c = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { d: round2(d), c: round2(c), balanced: round2(d) === round2(c) };
  }, [lines]);

  function setLine(idx: number, patch: Partial<JournalLine>) {
    const next = [...lines];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function addLine() {
    onChange([
      ...lines,
      { account_id: accounts[0]?.id ?? 0, cabang_id: 0, debit: 0, credit: 0, ref_type: null, ref_id: null },
    ]);
  }

  function removeLine(idx: number) {
    const next = [...lines];
    next.splice(idx, 1);
    onChange(next);
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Akun</th>
              <th style={{ textAlign: "right", width: 160 }}>Debit</th>
              <th style={{ textAlign: "right", width: 160 }}>Kredit</th>
              <th style={{ textAlign: "center", width: 160 }}>Ref</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="select"
                    value={l.account_id}
                    onChange={(e) => setLine(i, { account_id: Number(e.target.value) })}
                    disabled={readOnly}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ textAlign: "right" }}>
                  <input
                    type="number"
                    className="input"
                    style={{ textAlign: "right", width: 140 }}
                    value={l.debit}
                    onChange={(e) => setLine(i, { debit: toPos(e.target.value), credit: 0 })}
                    disabled={readOnly}
                    min={0}
                    step="0.01"
                  />
                </td>

                <td style={{ textAlign: "right" }}>
                  <input
                    type="number"
                    className="input"
                    style={{ textAlign: "right", width: 140 }}
                    value={l.credit}
                    onChange={(e) => setLine(i, { credit: toPos(e.target.value), debit: 0 })}
                    disabled={readOnly}
                    min={0}
                    step="0.01"
                  />
                </td>

                <td style={{ textAlign: "center", fontSize: 12 }}>
                  {l.ref_type ? (
                    <span className="badge">
                      {l.ref_type}#{l.ref_id}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>

                <td style={{ textAlign: "right" }}>
                  <button
                    className="button"
                    onClick={() => removeLine(i)}
                    disabled={readOnly}
                    aria-disabled={readOnly}
                    title={readOnly ? "Hanya-baca" : "Hapus baris"}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}

            <tr>
              <td style={{ textAlign: "right", fontWeight: 600 }}>Subtotal</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(totals.d)}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(totals.c)}</td>
              <td colSpan={2} style={{ textAlign: "center" }}>
                {totals.balanced ? (
                  <span className="badge badge-success">Seimbang</span>
                ) : (
                  <span className="badge badge-warning">Tidak seimbang</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="form-actions">
          <button className="button button-primary" onClick={addLine}>
            Tambah Baris
          </button>
        </div>
      )}
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function toPos(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? round2(n) : 0;
}
function formatMoney(n: number) {
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
