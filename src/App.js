import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState('');

  useEffect(() => {
    const videoElement = webcamRef.current.video;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    const onResults = (results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
          drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
        }
        detectGesture(results.multiHandLandmarks[0]);
      } else {
        setGesture("No Hands Detected");
      }
      canvasCtx.restore();
    };

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 1280,
      height: 720,
    });

    camera.start();
  }, []);

  const detectGesture = (landmarks) => {
    if (isOKSign(landmarks)) {
      setGesture("👌 OK Sign");
    } else if (isFist(landmarks)) {
      setGesture("✊ Fist");
    } else if (isOpenHand(landmarks)) {
      setGesture("🖐️ Open Hand");
    } else if (isPointing(landmarks)) {
      setGesture("👉 Pointing");
    } else if (isThumbsUp(landmarks)) {
      setGesture("👍 Thumbs Up");
    } else if (isThreeFingersUp(landmarks)) {
      setGesture(" ||| Three Fingers Up");
    } else {
      setGesture("Unknown Gesture");
    }
  };

  const isThumbsUp = (landmarks) => {
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const indexBase = landmarks[5];
    return thumbTip.y < thumbBase.y && thumbTip.y < indexBase.y;
  };

  const isFist = (landmarks) => {
    const fingerTips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerBases = [landmarks[2], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
    return fingerTips.every((tip, i) => Math.abs(tip.y - fingerBases[i].y) < 0.1);
  };


  const isOpenHand = (landmarks) => {
    const fingerTips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerBases = [landmarks[2], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
    return fingerTips.every((tip, i) => tip.y < fingerBases[i].y);
  };

  const isPointing = (landmarks) => {
    // Check if index finger is extended (index fingertip is above its base)
    const indexExtended = landmarks[8].y < landmarks[5].y;

    // Check if thumb is extended (thumb tip is far from thumb base in the x-axis)
    const thumbExtended = landmarks[4].x < landmarks[3].x; // Thumb to the side

    // Check if middle, ring, and pinky fingers are curled (tips below their bases)
    const middleCurled = landmarks[12].y > landmarks[9].y;
    const ringCurled = landmarks[16].y > landmarks[13].y;
    const pinkyCurled = landmarks[20].y > landmarks[17].y;

    // Return true if index and thumb are extended, and other fingers are curled
    return indexExtended && thumbExtended && middleCurled && ringCurled && pinkyCurled;
  };


  const isOKSign = (landmarks) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    return (
      Math.abs(thumbTip.x - indexTip.x) < 0.1 && // Thumb and index finger touching
      Math.abs(thumbTip.y - indexTip.y) < 0.1 && // Ensure they are close enough in both x and y
      middleTip.y < indexTip.y && // Other fingers not fully down (higher than index tip)
      ringTip.y < indexTip.y &&
      pinkyTip.y < indexTip.y
    );
  };


  const isThreeFingersUp = (landmarks) => {
    const indexExtended = landmarks[8].y < landmarks[5].y;
    const middleExtended = landmarks[12].y < landmarks[9].y;
    const ringExtended = landmarks[16].y < landmarks[13].y;
    const thumbTouchingPinky = Math.abs(landmarks[4].x - landmarks[20].x) < 0.05;
    return indexExtended && middleExtended && ringExtended && thumbTouchingPinky;
  };
  


  return (
    <div className="App">
      <header className="App-header">
        <Webcam ref={webcamRef} className="input_video" />
        <canvas ref={canvasRef} className="output_canvas" width="1280px" height="720px"></canvas>
        <div className="gesture">{gesture}</div>
      </header>
    </div>
  );
}

export default App;
