import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { Camera, RefreshCcw, Scan, Activity } from "lucide-react";

type Emotion = {
  expression: string;
  probability: number;
};

const getEmotionEmoji = (expression: string) => {
  const emojiMap: { [key: string]: string } = {
    happy: "😊",
    sad: "😢",
    angry: "😠",
    fearful: "😨",
    disgusted: "🤢",
    surprised: "😲",
    neutral: "😐",
  };
  return emojiMap[expression] || "❓";
};

function App() {
  const webcamRef = useRef<Webcam>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
          faceapi.nets.faceExpressionNet.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
        ]);
        setIsModelLoading(false);
        setError(null);
      } catch (error) {
        console.error("Error loading models:", error);
        setError(
          "Failed to load emotion detection models. Please refresh the page."
        );
        setIsModelLoading(false);
      }
    };

    loadModels();
  }, []);

  const captureAndAnalyze = async () => {
    if (!webcamRef.current?.video) {
      setError("Camera not ready. Please wait or refresh the page.");
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture image. Please try again.");
        return;
      }

      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const detections = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const emotions = Object.entries(detections.expressions);
        const dominantEmotion = emotions.reduce((prev, curr) =>
          curr[1] > prev[1] ? curr : prev
        )[0];

        setDominantEmotion(dominantEmotion);
        setIsCaptured(true);
        setShowCamera(false);
        setError(null);
      } else {
        setError("No face detected. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing face:", error);
      setError("Failed to analyze facial expressions. Please try again.");
    }
  };

  const resetCapture = () => {
    setDominantEmotion(null);
    setIsCaptured(false);
    setShowCamera(true);
    setError(null);
  };

  if (isModelLoading) {
    return (
      <div className="min-h-screen bg-[#080c1c] flex items-center justify-center">
        <div className="text-cyan-500 text-xl flex items-center gap-3">
          <Activity className="animate-pulse" />
          Initializing Neural Network...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#00000060] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,255,255,0.05),transparent)] pointer-events-none z-0" />
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-6 text-center animate-fade-in-down">
          TechXpression AI
        </h1>
        <p className="text-gray-400 text-center mb-8 animate-fade-in-up">
          <Scan className="animate-pulse inline-block" size={20} /> Advanced
          Emotion Recognition System
        </p>

        <div className="relative">
          <div className="rounded-lg shadow-[0_0_50px_rgba(0,200,255,0.3)] bg-gray-800/60 backdrop-blur-md p-6 border border-cyan-500/30">
            <div className="relative aspect-video flex items-center justify-center">
              {showCamera ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                    mirrored
                    videoConstraints={{
                      width: 440,
                      height: 250,
                      facingMode: "user",
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 rounded-lg">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500"></div>
                  </div>
                </>
              ) : (
                dominantEmotion && (
                  <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
                    <div className="text-[12rem] leading-none drop-shadow-lg">
                      {getEmotionEmoji(dominantEmotion)}
                    </div>
                    <div className="text-3xl text-cyan-400 capitalize font-semibold">
                      {dominantEmotion}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-600/10 border border-red-500/50 rounded-lg backdrop-blur-md">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div className="mt-10 flex justify-center gap-8">
            {!isCaptured ? (
              <button
                onClick={captureAndAnalyze}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-full flex items-center gap-2 text-lg font-bold hover:shadow-[0_0_30px_rgba(0,200,255,0.4)] transform transition-all hover:scale-105"
              >
                <Camera size={28} />
                Capture Emotion
              </button>
            ) : (
              <button
                onClick={resetCapture}
                className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-full flex items-center gap-2 text-lg font-bold transform transition-all hover:scale-105"
              >
                <RefreshCcw size={28} />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
