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
        {data && (
          <div className="mt-16 mb-4">
            <h2 className="text-xl font-bold mb-4 mx-auto text-center">
              ✨Sottotitoli Generati Con Successo!✨
            </h2>
            <div className="flex gap-2">
              <button
                className="btn btn-outline flex-1"
                onClick={handleDownloadWordByWord}
              >
                {isLoading ? "Caricamento..." : "Scarica Parola per Parola"}
              </button>
              <button
                className="btn btn-outline flex-1"
                onClick={handleDownloadSentenceBySentence}
              >
                {isLoading ? "Caricamento..." : "Scarica Frase per Frase"}
              </button>
            </div>
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
        {data && (
          <Image
            src="/cat-swagging.gif"
            alt="cat swagging"
            width={1280}
            height={720}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}
