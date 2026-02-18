// Toolbar.tsx
"use client";

import { useId, useState } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Upload,
  Undo2,
  Redo2,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Unlink,
  TableIcon,
  FileText,
  FileDown,
} from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onInsertTable: () => void;
  onExportAsPDF: () => void;
  onExportAsDOCX: () => void;
}

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

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Courier New",
  "Verdana",
  "Georgia",
  "Noto Sans Bengali",
];

export default function Toolbar({
  editor,
  fileInputRef,
  onFileUpload,
  onRemoveImage,
  onInsertTable,
  onExportAsPDF,
  onExportAsDOCX,
}: ToolbarProps) {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const fileInputId = useId();

  if (!editor) return null;

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

      <div className="relative">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
          className="h-9 w-9 hover:bg-blue-100 rounded-md"
          title="Font Family"
        >
          <span className="text-sm font-semibold">F</span>
        </Button>
        {showFontFamilyPicker && (
          <div className="absolute top-full left-0 p-2 border bg-white shadow-lg rounded-xl mt-1 z-40">
            {FONT_FAMILIES.map((font) => (
              <button
                key={font}
                className="block w-full text-left px-4 py-2 hover:bg-blue-100 rounded-md"
                style={{ fontFamily: font }}
                onClick={() => {
                  editor.chain().focus().setFontFamily(font).run();
                  setShowFontFamilyPicker(false);
                }}
              >
                {font}
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />
      {toolbarButton(
        <TableIcon size={16} />,
        editor.isActive("table"),
        onInsertTable,
        "Insert Table",
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />
      <label
        htmlFor={fileInputId}
        className={cn(
          "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg transition-all hover:bg-blue-100 hover:text-blue-600",
        )}
        title="Upload File"
      >
        <Upload size={16} />
      </label>
      <input
        id={fileInputId}
        type="file"
        accept=".docx"
        ref={fileInputRef}
        onChange={onFileUpload}
        className="hidden"
      />
      {toolbarButton(
        <Trash2 size={16} />,
        false,
        onRemoveImage,
        "Remove Selected Image",
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />
      {toolbarButton(
        <FileText size={16} />,
        false,
        onExportAsPDF,
        "Export as PDF",
      )}
      {toolbarButton(
        <FileDown size={16} />,
        false,
        onExportAsDOCX,
        "Export as DOCX",
      )}
    </div>
  );
}
