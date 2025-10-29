export function rupiah(n: number): string {
  return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
}
