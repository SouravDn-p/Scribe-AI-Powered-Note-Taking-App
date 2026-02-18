"use client";

import React, { useState } from "react";
import RichTextEditor from "@/components/TextEditor/RichTextEditor";

export default function Page() {
  const [content, setContent] = useState("");

  return (
    <div className="p-6">
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Write your content here..."
      />
    </div>
  );
}
