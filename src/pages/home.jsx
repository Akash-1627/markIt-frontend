import React, { useRef, useEffect, useState } from 'react';
import '../style.css';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const Home = () => {
    const webcamRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    // const [sending, setSending] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');
            setModelsLoaded(true);
        };
        loadModels();
    }, []);

    
    useEffect(() => {
        if (!modelsLoaded){
            console.log("MOdels not loaded");
            return;
        };

        const detectFace = async () => {
            // if (sending) return;

            const imageSrc = webcamRef.current.getScreenshot();
            const img = await faceapi.fetchImage(imageSrc);
            const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors().withFaceExpressions();

            if (detections.length > 0) {
                console.log('Face detected!');
                // sendImageToBackend(imageSrc);
            }
        };

        const intervalId = setInterval(detectFace, 3000); // Check for faces every second

        return () => {
            clearInterval(intervalId);
        };
    }, [modelsLoaded]);
    

    

    
    
    

    // const sendImageToBackend = async (imageSrc) => {
    //     try {
    //         const response = await axios.post('/api/face-detection', { imageSrc });
    //         console.log('Image sent to backend:', response.data);
    //         console.log("Image sent");
    //     } catch (error) {
    //         console.error('Error sending image to backend:', error);
    //     } finally {
    //         setSending(false);
    //     }
    // };

    return (
        <div className='camera-home'>
            <div className='webcam-container'>
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
