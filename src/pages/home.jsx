import React, { useRef, useEffect, useState } from "react";
import "../style.css";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";

const Home = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) {
      console.log("MOdels not loaded");
      return;
    }

    const detectFace = async () => {
      if (sending) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.error("Failed to capture image from webcam");
        return;
      }

      try {
        const img = await faceapi.fetchImage(imageSrc);
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions();

        if (detections.length > 0) {
            console.log("Detected!!");
          await sendImageToBackend(imageSrc);
        }
      } catch (error) {
        console.error("Error detecting face:", error);
      }
    };

    const intervalId = setInterval(detectFace, 3000); 

    return () => {
        clearInterval(intervalId);
    };
  }, [modelsLoaded, sending]);

  const sendImageToBackend = async (imageSrc) => {
    try {
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const formData = new FormData();
    formData.append("File1", blob, "webcam_image.jpg");
    const response = await axios.post(
      "http://localhost:5000/check-face",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
      console.log(response.data);
    } catch (error) {
      console.error("Error sending image to backend:", error);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="camera-home">
      <div className="webcam-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={640}
          height={480}
        />
      </div>
    </div>
  );
};

export default Home;
