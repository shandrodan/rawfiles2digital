"use client";
import React, { useState, useRef, useEffect } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini");
  // Flashcards feature states
  const [flashcards, setFlashcards] = useState("");
  const [flashFocus, setFlashFocus] = useState("vocabulary");
  const [flashDirection, setFlashDirection] = useState(">>");
  const [flashLoading, setFlashLoading] = useState(false);

  const dragItem = useRef();
  const dragOverItem = useRef();

useEffect(() => {
  const savedKey = localStorage.getItem("openai_api_key");
  if (savedKey) {
    setApiKey(savedKey);
    setSavedApiKey(savedKey); // make sure savedApiKey is set too
  }

  return () => {
    // revoke object URLs on unmount
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
  };
}, [files]);

  function handleSaveKey() {
    if (apiKey) {
      localStorage.setItem("openai_api_key", apiKey);
      setSavedApiKey(apiKey);
      alert("API Key saved locally on this device.");
    }
  }

  function handleClearKey() {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setSavedApiKey("");
    alert("API Key removed from this device.");
  }

  function addFilesFromFileList(fileList) {
    const arr = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2, 9),
      file: f,
      previewUrl: f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".heic")
        ? URL.createObjectURL(f)
        : null,
    }));
    setFiles((prev) => [...prev, ...arr]);
  }

  function handleInputChange(e) { addFilesFromFileList(e.target.files || []); }
  function handleDrop(e) { e.preventDefault(); addFilesFromFileList(e.dataTransfer.files || []); }
  function handleDragOver(e) { e.preventDefault(); }
  function onDragStart(e, pos) { dragItem.current = pos; }
  function onDragEnter(e, pos) { dragOverItem.current = pos; }
  function onDragEnd() {
    const copyList = [...files];
    const dragIndex = dragItem.current;
    const dropIndex = dragOverItem.current;
    if (dragIndex === undefined || dropIndex === undefined) return;
    const dragItemContent = copyList.splice(dragIndex, 1)[0];
    copyList.splice(dropIndex, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(copyList);
  }
  function onTouchStart(e, pos) {
  dragItem.current = pos;
}

function onTouchMove(e, pos) {
  e.preventDefault(); // prevents scrolling while dragging
  dragOverItem.current = pos;
}

function onTouchEnd() {
  const copyList = [...files];
  const dragIndex = dragItem.current;
  const dropIndex = dragOverItem.current;
  if (dragIndex === undefined || dropIndex === undefined) return;
  const draggedItem = copyList.splice(dragIndex, 1)[0];
  copyList.splice(dropIndex, 0, draggedItem);
  dragItem.current = null;
  dragOverItem.current = null;
  setFiles(copyList);
}


  function removeFile(id) {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f && f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function handleSubmit(e) {
    e && e.preventDefault();
    setError(""); setResult("");
    if (!savedApiKey) { setError("Please enter and save your OpenAI API Key first."); return; }
    if (!files.length) { setError("Please add at least one image file first."); return; }

    const formData = new FormData();
    files.forEach((f) => formData.append("file", f.file));
    formData.append("apiKey", savedApiKey);
    formData.append("model", selectedModel);

    setLoading(true);
    try {
      const res = await fetch("/api/process", { method: "POST", body: formData });
      if (!res.ok) { const msg = await res.text(); throw new Error(msg || "Request failed"); }
      const data = await res.json();
      setResult(data.text || "");
    } catch (err) { setError(err.message || "Something went wrong."); }
    finally { setLoading(false); }
  }
  async function handleClearFlashcards() {
  setFlashcards("");
  setError("");
}
    async function handleFlashcards() {
    setError(""); setFlashcards("");
    if (!savedApiKey) { setError("Please enter and save your OpenAI API Key first."); return; }
    if (!result) { setError("Please generate your digital note first."); return; }

    setFlashLoading(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: savedApiKey,
          model: selectedModel,
          focus: flashFocus,
          direction: flashDirection,
          note: result
        })

      });

      if (!res.ok) { const msg = await res.text(); throw new Error(msg || "Flashcard request failed"); }
      const data = await res.json();
      setFlashcards(data.text || "");
    } catch (err) {
      setError(err.message || "Something went wrong while generating flashcards.");
    } finally {
      setFlashLoading(false);
    }
  }
async function handleCopyFlashcards() {
  if (!flashcards) return;
  try {
    await navigator.clipboard.writeText(flashcards);
  } catch {
    setError("Failed to copy flashcards to clipboard.");
  }
}

  async function handleCopy() { if (!result) return; try { await navigator.clipboard.writeText(result); } catch { setError("Failed to copy to clipboard."); } }

  const buttonStyle = {
    background: "#7c46d4",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 6,
    cursor: "pointer"
  };
    const buttonStyle2 = {
    background: "#e3e3e3",
    color: "#000",
    border: "none",
    padding: "12px 20px",
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 6,
    cursor: "pointer"
  };

  return (
    <main style={{ maxWidth: 820, margin: "28px auto", padding: 16, background: "#f5f5f5", color: "#000", borderRadius: 6 }}>
      <h1 style={{ marginBottom: 8 }}>Raw Files 2 Digital Notes</h1>
      <p style={{ marginTop: 0, marginBottom: 16 }}>
        Upload files like pdf of pptx of lectures. Reorder them by dragging, then click Convert to get a
        single Markdown transcription. Your API key is stored directly on your device in your browser. We do not collect or store your data.
      </p>

      {/* API Key Section */}
      <div style={{ marginBottom: 16, padding: 12, border: "1px solid #e6e6e6", borderRadius: 6 }}>
        <label htmlFor="apiKeyInput" style={{ display: "block", marginBottom: 6 }}>OpenAI API Key:</label>
        <input
          type="password"
          id="apiKeyInput"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          style={{ width: "100%", marginBottom: 8, padding: 8, background: "#fff", color: "#000", border: "1px solid #e6e6e6", borderRadius: 4 }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button type="button" style={buttonStyle2} onClick={handleSaveKey}>Save Key</button>
          <button type="button" style={buttonStyle2} onClick={handleClearKey}>Delete Key</button>
        </div>

        {/* Model selector */}
        <div>
          <label htmlFor="modelSelect" style={{ marginRight: 8 }}>Choose model:</label>
          <select
            id="modelSelect"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{ padding: 8, background: "none", color: "#000", border: "1px solid #e6e6e6", borderRadius: 4 }}
          >
            <option value="gpt-5-mini">gpt-5-mini (recommended)</option>
            <option value="gpt-4o-mini">gpt-4o-mini (middle model)</option>
            <option value="gpt-5-nano">gpt-5-nano (the most cost effective)</option>
            <option value="gpt-5">gpt-5 (the most powerful and expensive)</option>
            <option value="o3">o3 (w/ reasoning)</option>
            <option value="o3-mini">o3-mini (w/ reasoning)</option>
            <option value="o4-mini">o4-mini (w/ reasoning)</option>
          </select>
        </div>
      </div>

      {/* File upload - disabled until API key saved */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: "2px dashed #e6e6e6",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
          opacity: savedApiKey ? 1 : 0.5,
          pointerEvents: savedApiKey ? "auto" : "none",
        }}
      >
        <input
          type="file"
          accept="image/*,.heic"
          multiple
          onChange={handleInputChange}
          style={{ display: "block", marginBottom: 8 }}
          disabled={!savedApiKey}
        />
        <div style={{ fontSize: 13 }}>
          {savedApiKey
            ? "Or drag & drop images here — reorder by dragging items."
            : "Enter and save your API Key first to enable file upload."}
        </div>
      </div>

      {files.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {files.map((f, idx) => (
            <div
              key={f.id}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragEnter={(e) => onDragEnter(e, idx)}
              onDragEnd={onDragEnd}
              onTouchStart={(e) => onTouchStart(e, idx)}
              onTouchMove={(e) => onTouchMove(e, idx)}
              onTouchEnd={onTouchEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 8,
                border: "1px solid #e6e6e6",
                borderRadius: 6,
                background: "#fff",
              }}
            >
              {f.previewUrl ? (
                <img
                  src={f.previewUrl}
                  alt={f.file.name}
                  style={{ width: 86, height: 64, objectFit: "cover", border: "1px solid #e6e6e6" }}
                />
              ) : (
                <div
                  style={{
                    width: 86,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    background: "#fff",
                    color: "#000",
                    border: "1px solid #e6e6e6",
                  }}
                >
                  <span style={{ fontSize: 12 }}>{f.file.name}</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.file.name}</div>
                <div style={{ fontSize: 12 }}>{Math.round(f.file.size / 1024)} KB</div>
              </div>
              <button type="button" style={buttonStyle} onClick={() => removeFile(f.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={loading || !savedApiKey} style={buttonStyle}>
          {loading ? "Processing..." : "Convert"}
        </button>
        <button onClick={() => { setFiles([]); setResult(""); setError(""); }} style={buttonStyle2}>
          Clear
        </button>
        <button onClick={handleCopy} disabled={!result} style={buttonStyle2}>
          Copy Result
        </button>
      </div>

      {error && <p style={{ color: "#ff4d4f", marginTop: 12 }}>{error}</p>}

        <h2 style={{ marginTop: 20 }}>Result</h2>
        <textarea
          value={result}
          onChange={(e) => setResult(e.target.value)}
          rows={18}
          placeholder="Your converted note will appear here. You can also type or edit freely."
          style={{
            width: "100%",
            fontFamily: "ui-monospace, Menlo, monospace",
            background: "#fff",
            color: "#000",
            border: "1px solid #000",
            borderRadius: 4
          }}
        />

      <br></br>
      <p style={{ marginTop: 32, marginBottom: 16, color: "#a8a8a8" }}>
  Created and maintained by the <a href="https://agetero.com" target="_blank" rel="noopener noreferrer" style={{ color: "#a8a8a8", textDecoration: "underline" }}>AgeTero Agency</a>
      </p>
    </main>
  );
}
