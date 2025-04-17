"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { transcribeAudio } from "../utils/assemblyai";

const fetcher = async (url) => {
  try {
    return await transcribeAudio(url);
  } catch (error) {
    throw new Error("Failed to transcribe audio: " + error.message);
  }
};

export default function LyricsPlayer() {
  const audioRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState("D:\desktop\transcipt\hindi-lyrics-player\src\app\public\song1.mp3"); // Update to /song1.mp3 if needed
  const { data, error, isLoading, mutate } = useSWR(audioUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const [currentIndex, setCurrentIndex] = useState(0); 

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !data?.words?.length) return;

    const onTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const index = data.words.findIndex((word) => word.start / 1000 > currentTime);
      setCurrentIndex(index === -1 ? data.words.length - 1 : Math.max(index - 1, 0));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [data]);

  useEffect(() => {
    if (lyricsContainerRef.current && currentIndex >= 0) {
      const activeElement = document.getElementById(`word-${currentIndex}`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentIndex]);

  const groupIntoSentences = (words) => {
    if (!words?.length) return [];

    const sentences = [];
    let currentSentence = "";
    let start = words[0]?.start;
    let end = words[0]?.end;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentSentence += word.text + " ";
      end = word.end;

      if (word.text.endsWith(".") || word.text.endsWith("?") || word.text.endsWith("।")) {
        sentences.push({ text: currentSentence.trim(), start, end });
        currentSentence = "";
        start = words[i + 1]?.start;
      }
    }

    if (currentSentence.trim()) {
      sentences.push({ text: currentSentence.trim(), start, end });
    }

    return sentences;
  };

  const sentences = groupIntoSentences(data?.words);

  const handleAudioError = (e) => {
    console.error("Audio error:", e);
    alert(`Failed to load audio file at ${audioUrl}. Please ensure the file exists in the public folder.`);
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-100 min-h-screen">
      <audio
        ref={audioRef}
        src={audioUrl}
        controls
        className="mb-6"
        onError={handleAudioError}
      />

      <button
        onClick={() => mutate()}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-2 rounded-md mb-6 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Fetch Hindi Lyrics"}
      </button>

      <div
        ref={lyricsContainerRef}
        className="w-full max-w-2xl h-96 overflow-y-auto p-4 bg-white rounded-md shadow-md"
      >
        {error ? (
          <p className="text-center text-red-500">
            Error loading lyrics: {error.message}
          </p>
        ) : sentences.length > 0 ? (
          sentences.map((sentence, idx) => (
            <div
              key={idx}
              id={`word-${idx}`}
              className={`py-2 transition-all ${
                idx === currentIndex ? "bg-yellow-300 text-black rounded" : "text-gray-600"
              }`}
            >
              <p className="text-lg">{sentence.text}</p>
              <p className="text-sm">{(sentence.start / 1000).toFixed(2)}s</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            {isLoading ? "Loading lyrics..." : "Press the button to get lyrics!"}
          </p>
        )}
      </div>
    </div>
  );
}