// utils/assemblyai.js
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: "2422f551831e405aa0ca9983483e57ec", // ⛔ Replace with env variables later
});

export const transcribeAudio = async (audioUrl) => {
  const transcript = await client.transcripts.transcribe({
    audio: audioUrl,
    language_code: 'hi', // Hindi
    punctuate: true,
    auto_highlights: true,
    format_text: true,
    speaker_labels: false,
  });

  return transcript;
};
