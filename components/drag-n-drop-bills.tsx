"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  LegacyRef,
  useMemo,
} from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Confetti from "react-confetti";
import { Toaster } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

interface DropResult {
  name: string;
}

interface DragItem {
  name: string;
}

interface ConfettiInstanceProps {
  x: number;
  y: number;
}

interface DropZoneProps {
  onDrop: (item: DragItem, dropPos: { x: number; y: number }) => void;
}

const BillGates: React.FC = () => {
  const [{ isDragging }, drag] = useDrag<
    DragItem,
    DropResult,
    { isDragging: boolean }
  >(() => ({
    type: "bill",
    item: { name: "Bill Gates" },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as LegacyRef<HTMLDivElement>}
      className={`w-48 h-48 rounded-lg overflow-hidden cursor-move transition-all duration-300 ${
        isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
      }`}
    >
      <Image
        src="/bill.jpg"
        alt="Bill Gates"
        className="w-full h-full object-cover"
        fill
      />
    </div>
  );
};

const DropZone: React.FC<DropZoneProps> = ({ onDrop }) => {
  const [{ isOver }, drop] = useDrop<DragItem, DropResult, { isOver: boolean }>(
    () => ({
      accept: "bill",
      drop: (item, monitor) => {
        const dropPos = monitor.getClientOffset();
        if (dropPos) {
          onDrop(item, dropPos);
        }
        return { name: "DropZone" };
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    })
  );

  return (
    <div
      ref={drop as unknown as LegacyRef<HTMLDivElement>}
      className={`w-full h-64 border-4 border-dashed rounded-lg flex items-center justify-center transition-colors duration-300 ${
        isOver ? "border-primary bg-primary/10" : "border-muted"
      }`}
    >
      <p className="text-lg font-medium text-muted-foreground">
        Drop Bill Here
      </p>
    </div>
  );
};

const ConfettiInstance: React.FC<ConfettiInstanceProps> = ({ x, y }) => {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCompleted(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const banknoteImage = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 15;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw banknote
      ctx.fillStyle = "#85bb65";
      ctx.fillRect(0, 0, 30, 15);
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(0, 0, 30, 15);
      ctx.font = "10px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 15, 7.5);
    }
    return canvas;
  }, []);

  if (completed) return null;

  return (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      recycle={false}
      numberOfPieces={100} // Reduced from 200
      confettiSource={{ x, y, w: 10, h: 10 }}
      drawShape={(ctx) => {
        ctx.drawImage(banknoteImage, -15, -7.5);
      }}
    />
  );
};

export function DragNDropBills() {
  const [billCount, setBillCount] = useState(0);
  const [confettiInstances, setConfettiInstances] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [, setWindowSize] = useState({ width: 0, height: 0 });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && billCount < 20) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100); // Update more frequently for smoother display
    }
    return () => clearInterval(interval);
  }, [startTime, billCount]);

  const handleDrop = useCallback(
    (item: DragItem, dropPos: { x: number; y: number }) => {
      setBillCount((prev) => {
        const newCount = prev + 1;
        if (newCount === 1) {
          setStartTime(Date.now());
        } else if (newCount === 20) {
          setGameCompleted(true);
        }
        return newCount;
      });
      setConfettiInstances((prev) => [
        ...prev,
        { id: Date.now(), x: dropPos.x, y: dropPos.y },
      ]);
    },
    []
  );

  const handleReset = useCallback(() => {
    setBillCount(0);
    setStartTime(null);
    setElapsedTime(0);
    setGameCompleted(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center">
              Drag n' Drop Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 flex justify-center items-center">
                <BillGates />
              </div>
              <div className="flex-1 space-y-4">
                <DropZone onDrop={handleDrop} />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Bills Processed
                    </p>
                    <span className="text-2xl font-bold">{billCount}</span>
                  </div>
                  <Progress value={(billCount / 20) * 100} className="h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Time Elapsed
                  </p>
                  <span className="text-2xl font-bold">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="h-[88px]">
                  {" "}
                  {/* Fixed height container for messages */}
                  {gameCompleted && (
                    <div
                      className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded"
                      role="alert"
                    >
                      <p className="font-bold">Congratulations!</p>
                      <p>
                        You processed 20 bills in {formatTime(elapsedTime)}{" "}
                        seconds.
                      </p>
                    </div>
                  )}
                  {billCount > 0 && billCount < 20 && (
                    <div
                      className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded"
                      role="alert"
                    >
                      <p className="font-bold flex items-center">
                        <AlertCircle className="mr-2" />
                        Timer is running!
                      </p>
                      <p>Keep dropping bills to reach 20.</p>
                    </div>
                  )}
                  {billCount === 0 && (
                    <div
                      className="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 rounded"
                      role="alert"
                    >
                      <p className="font-bold">Ready to start!</p>
                      <p>Drop the first bill to begin the timer.</p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Reset Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-0 pointer-events-none">
        {confettiInstances.map((instance) => (
          <ConfettiInstance key={instance.id} x={instance.x} y={instance.y} />
        ))}
      </div>
      <Toaster position="bottom-center" />
    </DndProvider>
  );
}
