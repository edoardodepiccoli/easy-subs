"use client";

import OpenAI from "openai";
import { useEffect, useState } from "react";

export default function Home() {
  const [subs, setSubs] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [inputKey, setInputKey] = useState("");

  useEffect(() => {
    const storedKey = localStorage.getItem("OPENAI_API_KEY");
    if (storedKey) {
      setApiKey(storedKey);
      setInputKey(storedKey);
    }
  }, []);

  const handleKeySave = () => {
    localStorage.setItem("OPENAI_API_KEY", inputKey.trim());
    setApiKey(inputKey.trim());
    alert("Saved!");
  };

  const generateSubs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !apiKey) return;

    setLoading(true);
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    try {
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        response_format: "srt",
      });
      setSubs(transcription as unknown as string);
    } catch (err) {
      console.error("Transcription failed:", err);
      setSubs("Errore durante la trascrizione.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSRT = () => {
    const blob = new Blob([subs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.srt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-sm p-4 mx-auto">
      <div className="mb-16">
        <label className="block mb-2 font-bold">OpenAI API Key</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="flex-1 input input-bordered"
            placeholder="sk-..."
          />
          <button
            onClick={handleKeySave}
            className="btn btn-secondary"
            disabled={!inputKey.trim()}
          >
            Salva
          </button>
        </div>
      </div>

      <form
        onSubmit={generateSubs}
        className="flex flex-col w-full gap-2 mb-16"
      >
        <label className="block w-full mb-4 text-2xl font-bold">
          Carica un file audio MP3 (max 24MB)
        </label>
        <div className="flex w-full gap-2">
          <input
            type="file"
            accept=".mp3,audio/*"
            className="flex-1 file-input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label className="label">
            parole singole
            <input type="checkbox" defaultChecked className="toggle" />
            frasi intere
          </label>
        </div>
        <button
          type="submit"
          className="w-full btn btn-primary"
          disabled={loading || !file || !apiKey || file.size > 26214400}
        >
          {loading ? "Trascrizione in corso..." : "Crea Sottotitoli"}
        </button>
      </form>

      <div>
        <p className="mb-4 text-2xl font-bold">
          {subs ? "Sottotitoli generati:" : "Nessun file caricato..."}
        </p>
        <textarea
          name="subtitles"
          id="subtitles"
          className="w-full h-64 mb-2 bg-base-200"
          value={subs}
          readOnly
        />
        <button
          className="w-full btn btn-outline"
          onClick={downloadSRT}
          disabled={!subs}
        >
          Scarica file .srt
        </button>
      </div>
    </div>
  );
}
