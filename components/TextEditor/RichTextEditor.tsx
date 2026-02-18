"use client";

import { useEffect, useRef, useState } from "react";
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

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
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
}: Props) {
  const pdfjsRef = useRef<typeof import("pdfjs-dist") | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
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
          "rich-text-content focus:outline-none min-h-[250px] p-4 text-gray-800 leading-relaxed",
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
      <div className="p-3 text-sm text-gray-500 border rounded-md animate-pulse">
        Loading editor…
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
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-lg transition-all hover:bg-blue-100 hover:text-blue-600",
        active && "bg-blue-600 text-white shadow-md",
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
      onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
      className={cn(
        "px-2 h-8 font-semibold rounded-md transition-all bg-transparent hover:bg-sky-100 hover:text-sky-600",
        editor.isActive("heading", { level }) &&
          "bg-sky-500 text-white shadow-md",
      )}
      title={`Heading ${level}`}
    >
      {label}
    </Button>
  );

  return (
    <div
      className={cn(
        "w-full border border-gray-200 rounded-xl shadow-md bg-white flex flex-col overflow-hidden",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 p-2 border-b bg-gradient-to-r from-gray-50 to-blue-50 backdrop-blur-md shadow-sm">
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
        <Separator orientation="vertical" className="h-6 mx-1" />

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
        <Separator orientation="vertical" className="h-6 mx-1" />

        {["H1", "H2", "H3", "H4"].map((h, i) =>
          headingButton(h, (i + 1) as 1 | 2 | 3 | 4),
        )}
        <Separator orientation="vertical" className="h-6 mx-1" />

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
        <Separator orientation="vertical" className="h-6 mx-1" />

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
        <Separator orientation="vertical" className="h-6 mx-1" />

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
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Color pickers */}
        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            className="h-9 w-9 hover:bg-blue-100 rounded-md"
            title="Text Color"
          >
            <span className="inline-block w-4 h-4 bg-black rounded-full"></span>
          </Button>
          {showTextColorPicker && (
            <div className="absolute top-full left-0 grid grid-cols-5 gap-2 p-2 border bg-white shadow-lg rounded-xl mt-1 z-40">
              {COLORS.map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  className="w-8 h-8 rounded-full border hover:scale-110 transition"
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
            className="h-9 w-9 hover:bg-blue-100 rounded-md"
            title="Highlight Color"
          >
            <span className="inline-block w-4 h-4 bg-yellow-300 rounded-full"></span>
          </Button>
          {showHighlightColorPicker && (
            <div className="absolute top-full left-0 grid grid-cols-5 gap-2 p-2 border bg-white shadow-lg rounded-xl mt-1 z-40">
              {COLORS.map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  className="w-8 h-8 rounded-full border hover:scale-110 transition"
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
            className="h-9 w-9 hover:bg-blue-100 rounded-md"
            title="Font Size"
          >
            <span className="text-sm font-semibold">A</span>
          </Button>
          {showFontSizePicker && (
            <div className="absolute top-full left-0 p-2 border bg-white shadow-lg rounded-xl mt-1 z-40">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-100 rounded-md"
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

        <Separator orientation="vertical" className="h-6 mx-1" />

        {toolbarButton(
          <Upload size={16} />,
          false,
          () => fileInputRef.current?.click(),
          "Upload File",
        )}
        <input
          type="file"
          accept=".txt,.doc,.docx"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        {toolbarButton(
          <ImageIcon size={16} />,
          false,
          () => imageInputRef.current?.click(),
          "Insert Image",
        )}
        <input
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
      </div>

      {/* Editor */}
      <div className="min-h-[300px] bg-white rounded-b-xl focus-within:ring-2 focus-within:ring-blue-400 p-3 overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .rich-text-content h1 { font-size: 2rem; margin: 0.5rem 0; font-weight:700; }
        .rich-text-content h2 { font-size: 1.6rem; margin: 0.45rem 0; font-weight:600; }
        .rich-text-content h3 { font-size: 1.3rem; margin: 0.4rem 0; font-weight:600; }
        .rich-text-content h4 { font-size: 1.1rem; margin: 0.35rem 0; font-weight:500; }
        .rich-text-content p { margin: 0.35rem 0; }
        .rich-text-content img { max-width: 100%; border-radius: 0.5rem; margin-top: 0.5rem; display:block; }
        .rich-text-content ul { list-style-type: disc; margin-left: 1.5rem; padding-left: 1rem; }
        .rich-text-content ol { list-style-type: decimal; margin-left: 1.5rem; padding-left: 1rem; }
        .rich-text-content li { margin: 0.25rem 0; }
        .rich-text-content a { color: #2563eb; text-decoration: underline; cursor: pointer; }
        .rich-text-content a:hover { color: #1d4ed8; }
      `}</style>
    </div>
  );
}
