"use client";

import { useEffect, useRef, useState } from "react";
import { generatePdfBlob } from "./DownloadPDF";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_DEBOUNCE_MS = 600;

type Props = {
  htmlContent: string;
  className?: string;
  onDownloadPdf?: (html: string) => void;
};

export default function PdfPreview({ htmlContent, className, onDownloadPdf }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = htmlContent?.trim() || "";

    if (!trimmed) {
      setPdfUrl(null);
      setError(null);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const blob = await generatePdfBlob(trimmed);
        if (blob) {
          const url = URL.createObjectURL(blob);
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          setPdfUrl(url);
        } else {
          setError("Failed to generate preview");
          setPdfUrl(null);
        }
      } catch {
        setError("Failed to generate preview");
        setPdfUrl(null);
      } finally {
        setIsGenerating(false);
        timeoutRef.current = null;
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [htmlContent]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  const isEmpty = !htmlContent?.trim();

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-900 dark:shadow-slate-950/50",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            PDF Preview
          </span>
          {isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="size-2 animate-pulse rounded-full bg-indigo-500" />
              Updating…
            </span>
          )}
        </div>
        {onDownloadPdf && pdfUrl && (
          <button
            type="button"
            onClick={() => onDownloadPdf(htmlContent)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Download className="size-3.5" />
            Download PDF
          </button>
        )}
      </div>

      <div className="relative flex-1 min-h-[400px] bg-slate-100 dark:bg-slate-800/50">
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 dark:border-slate-600">
              <FileText className="mx-auto size-12 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium">Start writing to see PDF preview</p>
            <p className="text-xs">Preview updates as you type</p>
          </div>
        )}

        {!isEmpty && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!isEmpty && !error && pdfUrl && (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title="PDF Preview"
            className="h-full w-full border-0"
          />
        )}

        {!isEmpty && !error && !pdfUrl && isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-600 dark:border-t-indigo-500" />
          </div>
        )}
      </div>
    </div>
  );
}
