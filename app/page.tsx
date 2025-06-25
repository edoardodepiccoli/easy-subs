"use client";

import OpenAI, { toFile } from "openai";
import { useEffect, useState } from "react";

export default function Home() {
  const [apiKey, setApiKey] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // API KEY
  const handleSetApiKey = () => {
    localStorage.setItem("apiKey", apiKey);
  };

  const handleGetApiKey = () => {
    const apiKey = localStorage.getItem("apiKey");
    if (apiKey) {
      setApiKey(apiKey);
    }
  };

  // HANDLE FILE UPLOAD
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // GENERATE TRANSCRIPTION
  const generateTranscription = async () => {
    if (!file || !apiKey) {
      alert("API Key e file sono obbligatori.");
      return;
    }
    setIsLoading(true);
    try {
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const openaiFile = await toFile(file, file.name);
      const data = await openai.audio.transcriptions.create({
        file: openaiFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment", "word"],
      });
      console.log(data); // verbose_json
    } catch (err) {
      console.error(err);
      alert("Errore durante la trascrizione");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetApiKey();
  }, []);

  return (
    <div className="max-w-screen-sm mx-auto p-4 flex flex-col gap-16">
      {/* api key section */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Imposta API Key</h1>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input flex-1"
          />
          <button onClick={handleSetApiKey} className="btn">
            Imposta API Key
          </button>
        </div>
      </div>
      {/* upload section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold mb-2">Carica un file MP3</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".mp3"
            className="file-input w-full flex-1"
            onChange={handleUploadFile}
          />
          <button
            className="btn btn-primary"
            onClick={generateTranscription}
            disabled={isLoading}
          >
            {isLoading ? "Caricamento..." : "Crea Sottotitoli"}
          </button>
        </div>
      </div>
    </div>
  );
}
