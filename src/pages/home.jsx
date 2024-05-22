import React, { useRef, useEffect, useState } from "react";
import "../style.css";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";

const Home = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [backendResponse, setBackendResponse] = useState([]); // State for backend response
  const [loading, setLoading] = useState(false); // State for loading message

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
      console.log("Models not loaded");
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
          setLoading(true); // Show loading message
          setSending(true); // Set sending state to true
          await sendImageToBackend(imageSrc);
        }
      } catch (error) {
        console.error("Error detecting face:", error);
      }
    };

    const intervalId = setInterval(detectFace, 1000);

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
      if (
        response.data.result &&
        response.data.result[0] &&
        response.data.result[0]._label
      ) {
        // Parse the name and roll number from the label
        setBackendResponse([]);
        const label = response.data.result[0]._label;
        const parsedData = parseLabel(label);
        setBackendResponse(parsedData);
      } else {
        setBackendResponse(["no_face_found"]);
        console.error("Label data not found in the response.");
      }
    } catch (error) {
      console.error("Error sending image to backend:", error);
      setBackendResponse(["no_face_found"]);
    } finally {
      setLoading(false); // Hide loading message

      // Hide the response after 3 seconds and allow sending again
      setTimeout(() => {
        setBackendResponse([]);
        setSending(false); // Allow sending again after the response is hidden
      }, 3000);
    }
  };

  const parseLabel = (label) => {
    try {
      // Replace curly braces and quotes, then split by comma
      const cleanedLabel = label.replace(/[{}"]/g, '').split(',');
      return cleanedLabel.map(item => item.trim());
    } catch (error) {
      console.error("Error parsing label:", error);
      return [];
    }
  };

  return (
    <>
    <div className="heading">
        <h1>MarkIt - Attendance System</h1>
      </div>
    <div className="camera-home">
      <h2>Please place your face in front of camera</h2>
      <div className="webcam-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={640}
          height={480}
        />
        {(loading || backendResponse.length > 0) && (
        <div
          className={`response-overlay ${
            loading ? '' : backendResponse[0] !== "no_face_found" ? 'response-success' : 'response-error'
          }`}
        >
          {loading ? (
            <>
              <h3>Marking Attendance...</h3>
              <h3>This may take a few seconds...</h3>
            </>
          ) : (
            <>
              {backendResponse[0] !== "no_face_found" ? (
                <>
                  <h3>Attendance Marked</h3>
                  <h3>Name: {backendResponse[0]}</h3>
                  <h3>Roll No: {backendResponse[1]}</h3>
                </>
              ) : (
                <>
                  <h3>Attendance data not found</h3>
                </>
              )}
            </>
          )}
        </div>
      )}

      </div>
    </div>
    </>
  );
};

export default Home;
