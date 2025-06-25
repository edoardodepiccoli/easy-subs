/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import OpenAI, { toFile } from "openai";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [apiKey, setApiKey] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

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
      setData(data);
      console.log(data); // verbose_json
    } catch (err) {
      console.error(err);
      alert("Errore durante la trascrizione");
    } finally {
      setIsLoading(false);
    }
  };

  // GENERATE SRT FILE
  const generateSrtFile = (data: any, type: "word" | "sentence") => {
    let items = [];
    if (type === "sentence") {
      // Sentence by sentence: use segments
      items = data.segments || [];
      return items
        .map((item: any, idx: number) => {
          const start = secondsToSrtTimestamp(item.start);
          const end = secondsToSrtTimestamp(item.end);
          return `${idx + 1}\n${start} --> ${end}\n${item.text.trim()}\n`;
        })
        .join("\n");
    } else {
      // Word by word: use words
      items = data.words || [];
      return items
        .map((item: any, idx: number) => {
          const start = secondsToSrtTimestamp(item.start);
          const end = secondsToSrtTimestamp(item.end);
          return `${idx + 1}\n${start} --> ${end}\n${item.word}\n`;
        })
        .join("\n");
    }
  };

  // Helper: convert seconds to SRT timestamp
  function secondsToSrtTimestamp(seconds: number) {
    const date = new Date(0);
    date.setSeconds(seconds);
    const ms = Math.floor((seconds % 1) * 1000);
    return (
      date.toISOString().substr(11, 8).replace(".", ",") +
      `,${ms.toString().padStart(3, "0")}`
    );
  }

  // DOWNLOAD WORD BY WORD
  const handleDownloadWordByWord = () => {
    if (!data) return;
    const srt = generateSrtFile(data, "word");
    downloadSrt(srt, "word_by_word.srt");
  };

  // DOWNLOAD SENTENCE BY SENTENCE
  const handleDownloadSentenceBySentence = () => {
    if (!data) return;
    const srt = generateSrtFile(data, "sentence");
    downloadSrt(srt, "sentence_by_sentence.srt");
  };

  // Helper: trigger download of SRT file
  function downloadSrt(srtContent: string, filename: string) {
    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  useEffect(() => {
    handleGetApiKey();
  }, []);

  return (
    <div className="max-w-screen-sm mx-auto p-4 flex flex-col gap-4">
      {/* api key section */}
      <div className="card-body bg-base-200 rounded-lg p-8">
        <h1 className="text-sm font-bold">Imposta API Key</h1>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input input-sm flex-1"
            autoComplete="off"
            placeholder="Inserisci la tua API Key"
          />
          <button onClick={handleSetApiKey} className="btn btn-sm btn-outline">
            Imposta API Key
          </button>
        </div>
      </div>
      {/* upload section */}
      <div className="flex flex-col gap-4 card-body bg-base-200 rounded-lg p-8">
        <h1 className="text-2xl font-bold">Carica un file MP3</h1>
        <div className="flex-col md:flex-row md:flex gap-2">
          <input
            type="file"
            accept=".mp3"
            className="file-input w-full flex-3"
            onChange={handleUploadFile}
          />
          <button
            className="btn btn-primary md:flex-1 w-full md:w-auto mt-2 md:mt-0"
            onClick={generateTranscription}
            disabled={isLoading}
          >
            {isLoading ? "Caricamento..." : "Crea Sottotitoli"}
          </button>
        </div>
        {data && (
          <div>
            <h2 className="text-xl font-bold mb-4 mx-auto text-center card-body bg-primary text-white rounded-lg p-4">
              ✨Sottotitoli Generati Con Successo!✨
            </h2>
            <div className="flex-col md:flex-row md:flex gap-2 mb-4">
              <button
                className="btn btn-outline w-full md:flex-1 mb-2 md:mb-0"
                onClick={handleDownloadWordByWord}
              >
                {isLoading ? "Caricamento..." : "👉 Scarica Parola per Parola"}
              </button>
              <button
                className="btn btn-outline w-full md:flex-1"
                onClick={handleDownloadSentenceBySentence}
              >
                {isLoading ? "Caricamento..." : "👉 Scarica Frase per Frase"}
              </button>
            </div>
            <Image
              src="/cat-swagging.gif"
              alt="cat swagging"
              width={1280}
              height={720}
              className="w-full"
            />
          </div>
        )}
        {/* funny gifs */}
        {isLoading && (
          <Image
            src="/cat-reading.gif"
            alt="cat reading"
            width={1280}
            height={720}
            className="w-full mt-4"
          />
        )}
      </div>
    </div>
  );
}
