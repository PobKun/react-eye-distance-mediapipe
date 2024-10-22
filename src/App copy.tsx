import { useEffect, useRef } from 'react';
import { FaceMesh, FACEMESH_LEFT_IRIS, Results } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
// import '@mediapipe/face_mesh/face_mesh.min.css';

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // alert(videoRef.current); // ตรวจสอบว่า videoRef มีค่าหรือไม่
console.log(videoRef.current);

    if (canvasRef.current) {
      canvasRef.current.width = 640; // ปรับขนาดให้ตรง
      canvasRef.current.height = 480;
      const canvasCtx = canvasRef.current!.getContext('2d')!;
      canvasCtx.fillStyle = "red"; // สีของข้อความ
      canvasCtx.font = "16px Arial"; // ขนาดและฟอนต์
      canvasCtx.fillText(`OK`, 50, 20); // เขียนข้อความ
    }

    
    try {
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
        const camera = new cam.Camera(videoRef.current!, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.current! });
          },
          width: 640,
          height: 480,
        });

        camera.start();

        return () => {
          camera.stop();
        };
    }catch(e){
      alert(e)
    }

   
     
  }, []);

  const onFaceMeshResults = (results: Results) => {
    const canvasCtx = canvasRef.current!.getContext('2d')!;

      if (canvasCtx) {
          canvasCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      }

    if (results.multiFaceLandmarks) {
      let irisLeftMinX = -1;
      let irisLeftMaxX = -1;
      for (const landmarks of results.multiFaceLandmarks) {
       
        for (const point of FACEMESH_LEFT_IRIS) {
          const point0 = landmarks[point[0]];

          if (irisLeftMinX === -1 || point0.x * canvasRef.current!.width < irisLeftMinX) {
            irisLeftMinX = point0.x * canvasRef.current!.width;
          }
          if (irisLeftMaxX === -1 || point0.x * canvasRef.current!.width > irisLeftMaxX) {
            irisLeftMaxX = point0.x * canvasRef.current!.width;
          }
        }

        // วาดการเชื่อมต่อระหว่างจุด Iris
        canvasCtx.strokeStyle = "#30FF30";
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();

        // วาดจุด Iris
        for (const point of FACEMESH_LEFT_IRIS) {
          const point0 = landmarks[point[0]];
          const x = point0.x * canvasRef.current!.width;
          const y = point0.y * canvasRef.current!.height;

          canvasCtx.lineTo(x, y);
        }
        canvasCtx.closePath();
        canvasCtx.stroke();
      }

      const dx = irisLeftMaxX - irisLeftMinX; // ความกว้างของ Iris ในภาพ
      const dX = 11.7; // ความกว้างจริงของ Iris ในมิลลิเมตร
      const normalizedFocaleX = 1.40625; // ค่าฟอกกล้อง
      const fx = Math.min(canvasRef.current!.width, canvasRef.current!.height) * normalizedFocaleX; // คำนวณฟอกกล้อง

      let dZ = (fx * (dX / dx)) / 10.0; // แปลงหน่วยเป็นเซนติเมตร
      dZ = parseFloat(dZ.toFixed(2)); // ปรับให้เป็นทศนิยม 2 ตำแหน่ง

      // console.log(`Estimated distance from camera: ${dZ} cm`);
      canvasCtx.fillStyle = "red"; // สีของข้อความ
      canvasCtx.font = "16px Arial"; // ขนาดและฟอนต์
      canvasCtx.fillText(`Estimated distance from camera: ${dZ} cm`, 10, 20); // เขียนข้อความ
    }
  };

  return (
    <div>
      <video ref={videoRef} style={{ display: 'none' }} autoPlay muted  />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'block' }}  />
      <span>OK</span>
    </div>
  );
};

export default App;
