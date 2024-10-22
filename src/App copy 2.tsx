import React, { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh, FACEMESH_LEFT_IRIS, Results } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
      const canvasCtx = canvasRef.current.getContext('2d')!;
      canvasCtx.fillStyle = "red";
      canvasCtx.font = "16px Arial";
      canvasCtx.fillText(`OK`, 50, 20);
    }

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onFaceMeshResults);

    const startCamera = () => {
      const video = webcamRef.current?.video; // ตรวจสอบว่า webcamRef.current ไม่ใช่ null
      if (video) {
        const camera = new cam.Camera(video, {
          onFrame: async () => {
            await faceMesh.send({ image: video });
          },
          width: 640,
          height: 480,
        });

        camera.start();
        return camera;
      }
    };

    const camera = startCamera();

    return () => {
      camera?.stop(); // หยุดกล้องถ้ามี
    };
  }, []);

  const onFaceMeshResults = (results: Results) => {
    const canvasCtx = canvasRef.current!.getContext('2d')!;
    if(!canvasRef.current) {
      return
    }
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiFaceLandmarks) {
      let irisLeftMinX = -1;
      let irisLeftMaxX = -1;
      for (const landmarks of results.multiFaceLandmarks) {
        for (const point of FACEMESH_LEFT_IRIS) {
          const point0 = landmarks[point[0]];

          if (irisLeftMinX === -1 || point0.x * canvasRef.current.width < irisLeftMinX) {
            irisLeftMinX = point0.x * canvasRef.current.width;
          }
          if (irisLeftMaxX === -1 || point0.x * canvasRef.current.width > irisLeftMaxX) {
            irisLeftMaxX = point0.x * canvasRef.current.width;
          }
        }

        canvasCtx.strokeStyle = "#30FF30";
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();

        for (const point of FACEMESH_LEFT_IRIS) {
          const point0 = landmarks[point[0]];
          const x = point0.x * canvasRef.current.width;
          const y = point0.y * canvasRef.current.height;

          canvasCtx.lineTo(x, y);
        }
        canvasCtx.closePath();
        canvasCtx.stroke();
      }

      const dx = irisLeftMaxX - irisLeftMinX;
      const dX = 11.7;
      const normalizedFocaleX = 1.40625;
      const fx = Math.min(canvasRef.current.width, canvasRef.current.height) * normalizedFocaleX;

      let dZ = (fx * (dX / dx)) / 10.0;
      dZ = parseFloat(dZ.toFixed(2));

      canvasCtx.fillStyle = "red";
      canvasCtx.font = "16px Arial";
      canvasCtx.fillText(`Estimated distance from camera: ${dZ} cm`, 10, 20);
    }
  };

  return (
    <div>
      <Webcam ref={webcamRef} mirrored={true} videoConstraints={{
          facingMode: 'user', // สำหรับกล้องหน้า
          width: 640,
          height: 480,
        }}  style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'block'  }} />
      <span>OK</span>
    </div>
  );
};

export default App;
