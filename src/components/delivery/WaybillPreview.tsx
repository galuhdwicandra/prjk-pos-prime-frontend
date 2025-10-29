import { useEffect, useRef } from "react";

type Props = {
  html: string;
  onClose?: () => void;
};

export default function WaybillPreview({ html, onClose }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-background rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-semibold text-sm">Surat Jalan — Preview</div>
          <div className="space-x-2">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-muted"
              onClick={() => {
                const iframe = ref.current;
                iframe?.contentWindow?.print();
              }}
            >
              Print
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border hover:bg-muted" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
        <iframe ref={ref} className="flex-1 w-full bg-white" title="Waybill Preview" />
      </div>
    </div>
  );
}
