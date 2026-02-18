"use client";

import React, { useCallback, useState } from "react";
import RichTextEditor from "@/components/TextEditor/RichTextEditor";
import PdfPreview from "@/components/TextEditor/PdfPreview";
import DownloadPDF from "@/components/TextEditor/DownloadPDF";
import DownloadDocs from "@/components/TextEditor/DownloadDocs";
import { PenLine } from "lucide-react";
import toast from "react-hot-toast";

export default function Page() {
  const [content, setContent] = useState("");

  const handleDownloadPdf = useCallback((getHtml: () => string) => {
    const html = getHtml();
    if (!html.trim()) {
      toast.error("Nothing to export");
      return;
    }
    toast.promise(DownloadPDF(html, undefined, undefined, "document"), {
      loading: "Generating PDF…",
      success: "PDF downloaded",
      error: "Failed to download PDF",
    });
  }, []);

  const handleDownloadPdfFromHtml = useCallback((html: string) => {
    if (!html.trim()) {
      toast.error("Nothing to export");
      return;
    }
    toast.promise(DownloadPDF(html, undefined, undefined, "document"), {
      loading: "Generating PDF…",
      success: "PDF downloaded",
      error: "Failed to download PDF",
    });
  }, []);

  const handleDownloadDocx = useCallback((getHtml: () => string) => {
    const html = getHtml();
    if (!html.trim()) {
      toast.error("Nothing to export");
      return;
    }
    toast.promise(DownloadDocs(html, "document.docx"), {
      loading: "Generating DOCX…",
      success: "DOCX downloaded",
      error: "Failed to download DOCX",
    });
  }, []);

  const handlePrint = useCallback((getHtml: () => string) => {
    const html = getHtml();
    if (!html.trim()) {
      toast.error("Nothing to print");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Print</title></head>
          <body style="font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem;">
            ${html}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }, []);

  const handleClear = useCallback(() => {
    setContent("");
    toast.success("Content cleared");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
            <PenLine className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Scribe
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Professional document editor with live PDF preview
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="flex flex-col lg:min-h-[600px]">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing something amazing..."
              onDownloadPdf={handleDownloadPdf}
              onDownloadDocx={handleDownloadDocx}
              onPrint={handlePrint}
              onClear={handleClear}
            />
          </div>
          <div className="flex flex-col xl:min-h-[600px]">
            <PdfPreview
              htmlContent={content}
              className="h-full min-h-[500px] xl:min-h-[600px]"
              onDownloadPdf={handleDownloadPdfFromHtml}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
