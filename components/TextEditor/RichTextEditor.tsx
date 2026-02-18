"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Extension } from "@tiptap/core";

import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Upload,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Unlink,
  FileText,
  FileDown,
  Printer,
  Eraser,
} from "lucide-react";
import Swal from "sweetalert2";

import mammoth from "mammoth";
import { cn } from "@/lib/utils";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    };
  },
});

function getWordCount(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").filter(Boolean).length : 0;
}

function getCharCount(html: string): number {
  return html.replace(/<[^>]*>/g, "").length;
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onDownloadPdf?: (getHtml: () => string) => void;
  onDownloadDocx?: (getHtml: () => string) => void;
  onClear?: () => void;
  onPrint?: (getHtml: () => string) => void;
};

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#808080",
  "#008080",
  "#C0C0C0",
  "#800000",
  "#008000",
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px"];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something amazing...",
  className = "",
  onDownloadPdf,
  onDownloadDocx,
  onClear,
  onPrint,
}: Props) {
  const pdfjsRef = useRef<typeof import("pdfjs-dist") | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();
  const imageInputId = useId();
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] =
    useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;

      const pdfjsLib = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      if (!cancelled) {
        pdfjsRef.current = pdfjsLib;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontSize,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-content focus:outline-none min-h-[280px] px-6 py-6 text-slate-700 leading-[1.7] dark:text-slate-300",
        "data-placeholder": placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML())
      editor.commands.setContent(value || "");
  }, [value, editor]);

  if (!editor)
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <div className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-600 dark:border-t-indigo-500" />
          <span className="text-sm font-medium">Loading editor…</span>
        </div>
      </div>
    );

  const toggle = (cmd: () => void) => () => cmd();

  const addLink = async () => {
    const { value: url } = await Swal.fire({
      title: "Insert a link",
      input: "url",
      inputPlaceholder: "https://example.com",
      confirmButtonText: "Insert",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      background: "#f9fafb",
      inputValidator: (v) => (!v ? "Please enter a URL" : undefined),
    });
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
      Swal.fire({
        icon: "success",
        title: "Link added",
        timer: 900,
        showConfirmButton: false,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      /* ===================== PDF ===================== */
      if (ext === "pdf") {
        if (!pdfjsRef.current) {
          Swal.fire("PDF not ready", "Please try again", "warning");
          return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsRef.current.getDocument({ data: arrayBuffer })
          .promise;

        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText +=
            content.items
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((item: any) => item.str)
              .join(" ") + "\n\n";
        }

        editor.chain().focus().insertContent(`<p>${extractedText}</p>`).run();
      } else if (ext === "docx") {
        /* ===================== DOCX ===================== */
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        editor.chain().focus().insertContent(result.value).run();
      } else if (ext === "txt") {
        /* ===================== TXT ===================== */
        const text = await file.text();

        editor.chain().focus().insertContent(`<pre>${text}</pre>`).run();
      } else if (file.type.startsWith("image/")) {
        /* ===================== IMAGE ===================== */
        const reader = new FileReader();

        reader.onload = () => {
          editor
            .chain()
            .focus()
            .setImage({ src: reader.result as string })
            .run();
        };

        reader.readAsDataURL(file);
      } else {
        /* ===================== UNSUPPORTED ===================== */
        Swal.fire(
          "Unsupported file",
          "Only PDF, DOCX, TXT, and Images are allowed",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Upload failed", "Something went wrong", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      editor.chain().focus().setImage({ src: base64 }).run();
      Swal.fire({
        icon: "success",
        title: "Image inserted",
        timer: 800,
        showConfirmButton: false,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (editor.isActive("image")) {
      editor
        .chain()
        .focus()
        .deleteRange({
          from: editor.state.selection.from - 1,
          to: editor.state.selection.to,
        })
        .run();
    } else {
      editor.chain().focus().deleteSelection().run();
    }
    Swal.fire({
      icon: "success",
      title: "Removed",
      timer: 700,
      showConfirmButton: false,
    });
  };

  const toolbarButton = (
    icon: React.ReactNode,
    active: boolean,
    onClick: () => void,
    title: string,
  ) => (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "size-8 rounded-md text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
        active &&
          "bg-indigo-100 text-indigo-700 shadow-sm dark:bg-indigo-900/50 dark:text-indigo-300",
      )}
      title={title}
    >
      {icon}
    </Button>
  );

  const headingButton = (label: string, level: 1 | 2 | 3 | 4) => (
    <Button
      key={label}
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
      className={cn(
        "h-8 px-2.5 text-xs font-semibold rounded-md transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
        editor.isActive("heading", { level }) &&
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
      )}
      title={`Heading ${level}`}
    >
      {label}
    </Button>
  );

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-900 dark:shadow-slate-950/50",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50">
        {toolbarButton(
          <Bold size={16} />,
          editor.isActive("bold"),
          toggle(() => editor.chain().focus().toggleBold().run()),
          "Bold",
        )}
        {toolbarButton(
          <Italic size={16} />,
          editor.isActive("italic"),
          toggle(() => editor.chain().focus().toggleItalic().run()),
          "Italic",
        )}
        {toolbarButton(
          <UnderlineIcon size={16} />,
          editor.isActive("underline"),
          toggle(() => editor.chain().focus().toggleUnderline().run()),
          "Underline",
        )}
        {toolbarButton(
          <Strikethrough size={16} />,
          editor.isActive("strike"),
          toggle(() => editor.chain().focus().toggleStrike().run()),
          "Strikethrough",
        )}
        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        {toolbarButton(
          <Undo2 size={16} />,
          false,
          () => editor.chain().focus().undo().run(),
          "Undo",
        )}
        {toolbarButton(
          <Redo2 size={16} />,
          false,
          () => editor.chain().focus().redo().run(),
          "Redo",
        )}
        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        {["H1", "H2", "H3", "H4"].map((h, i) =>
          headingButton(h, (i + 1) as 1 | 2 | 3 | 4),
        )}
        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        {toolbarButton(
          <List size={16} />,
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          "Bullet List",
        )}
        {toolbarButton(
          <ListOrdered size={16} />,
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          "Numbered List",
        )}
        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        {toolbarButton(
          <AlignLeft size={16} />,
          editor.isActive({ textAlign: "left" }),
          () => editor.chain().focus().setTextAlign("left").run(),
          "Align Left",
        )}
        {toolbarButton(
          <AlignCenter size={16} />,
          editor.isActive({ textAlign: "center" }),
          () => editor.chain().focus().setTextAlign("center").run(),
          "Align Center",
        )}
        {toolbarButton(
          <AlignRight size={16} />,
          editor.isActive({ textAlign: "right" }),
          () => editor.chain().focus().setTextAlign("right").run(),
          "Align Right",
        )}
        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        {toolbarButton(
          <Link2 size={16} />,
          editor.isActive("link"),
          addLink,
          "Add Link",
        )}
        {toolbarButton(
          <Unlink size={16} />,
          false,
          () => editor.chain().focus().unsetLink().run(),
          "Remove Link",
        )}
        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        {/* Color pickers */}
        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            className="size-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Text Color"
          >
            <span className="inline-block size-4 rounded-full border border-slate-300 bg-slate-900 dark:border-slate-600 dark:bg-white"></span>
          </Button>
          {showTextColorPicker && (
            <div className="absolute left-0 top-full z-40 mt-1.5 grid grid-cols-5 gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {COLORS.map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  className="size-7 rounded-full border-2 border-slate-200 transition-transform hover:scale-110 dark:border-slate-600"
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setShowTextColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() =>
              setShowHighlightColorPicker(!showHighlightColorPicker)
            }
            className="size-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Highlight Color"
          >
            <span className="inline-block size-4 rounded-full bg-amber-300 ring-1 ring-slate-200 dark:ring-slate-600"></span>
          </Button>
          {showHighlightColorPicker && (
            <div className="absolute left-0 top-full z-40 mt-1.5 grid grid-cols-5 gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {COLORS.map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  className="size-7 rounded-full border-2 border-slate-200 transition-transform hover:scale-110 dark:border-slate-600"
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color: c }).run();
                    setShowHighlightColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            className="size-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Font Size"
          >
            <span className="text-xs font-bold tracking-tight">A</span>
          </Button>
          {showFontSizePicker && (
            <div className="absolute left-0 top-full z-40 mt-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => {
                    editor.chain().focus().setFontSize(size).run();
                    setShowFontSizePicker(false);
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator
          orientation="vertical"
          className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
        />

        <label
          htmlFor={fileInputId}
          className={cn(
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
          )}
          title="Upload File"
        >
          <Upload size={16} />
        </label>
        <input
          id={fileInputId}
          type="file"
          accept=".txt,.doc,.docx,.pdf"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <label
          htmlFor={imageInputId}
          className={cn(
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
          )}
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </label>
        <input
          id={imageInputId}
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        {toolbarButton(
          <Trash2 size={16} />,
          false,
          removeImage,
          "Remove Selected Image",
        )}

        {(onDownloadPdf || onDownloadDocx) && (
          <>
            <Separator
              orientation="vertical"
              className="mx-1.5 h-5 bg-slate-200 dark:bg-slate-600"
            />
            {onDownloadPdf && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDownloadPdf(() => editor.getHTML())}
                className="size-8 rounded-md text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300"
                title="Download PDF"
              >
                <FileText size={16} />
              </Button>
            )}
            {onDownloadDocx && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDownloadDocx(() => editor.getHTML())}
                className="size-8 rounded-md text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300"
                title="Download DOCX"
              >
                <FileDown size={16} />
              </Button>
            )}
            {onPrint && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPrint(() => editor.getHTML())}
                className="size-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Print"
              >
                <Printer size={16} />
              </Button>
            )}
            {onClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="size-8 rounded-md text-slate-600 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                title="Clear content"
              >
                <Eraser size={16} />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Editor */}
      <div className="min-h-[320px] overflow-y-auto bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:ring-inset dark:bg-slate-900 dark:focus-within:ring-indigo-500/30 max-h-[70vh]">
        <EditorContent editor={editor} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-4 py-2 text-xs text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/30 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {getWordCount(value)}
            </strong>{" "}
            words
          </span>
          <span>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {getCharCount(value)}
            </strong>{" "}
            characters
          </span>
        </div>
      </div>

      <style>{`
        .rich-text-content p.is-empty:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .dark .rich-text-content p.is-empty:first-child::before {
          color: #64748b;
        }
        .rich-text-content h1 { font-size: 2rem; margin: 0.75rem 0 0.5rem; font-weight: 700; letter-spacing: -0.025em; color: #0f172a; }
        .dark .rich-text-content h1 { color: #f8fafc; }
        .rich-text-content h2 { font-size: 1.5rem; margin: 0.65rem 0 0.4rem; font-weight: 600; letter-spacing: -0.02em; color: #0f172a; }
        .dark .rich-text-content h2 { color: #f8fafc; }
        .rich-text-content h3 { font-size: 1.25rem; margin: 0.55rem 0 0.35rem; font-weight: 600; color: #0f172a; }
        .dark .rich-text-content h3 { color: #f8fafc; }
        .rich-text-content h4 { font-size: 1.1rem; margin: 0.45rem 0 0.3rem; font-weight: 600; color: #0f172a; }
        .dark .rich-text-content h4 { color: #f8fafc; }
        .rich-text-content p { margin: 0.4rem 0; }
        .rich-text-content img { max-width: 100%; border-radius: 0.75rem; margin: 0.75rem 0; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
        .rich-text-content ul { list-style-type: disc; margin: 0.5rem 0; padding-left: 1.5rem; }
        .rich-text-content ol { list-style-type: decimal; margin: 0.5rem 0; padding-left: 1.5rem; }
        .rich-text-content li { margin: 0.2rem 0; }
        .rich-text-content a { color: #4f46e5; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-weight: 500; }
        .rich-text-content a:hover { color: #4338ca; }
        .dark .rich-text-content a { color: #818cf8; }
        .dark .rich-text-content a:hover { color: #a5b4fc; }
      `}</style>
    </div>
  );
}
