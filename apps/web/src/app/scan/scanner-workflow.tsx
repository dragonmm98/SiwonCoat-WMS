"use client";

import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const workflows = [
  ["Receive", "Inbound at dock"],
  ["Putaway", "Move to storage"],
  ["Pick", "Collect order items"],
  ["Pack", "Verify shipment"],
] as const;

type WorkflowName = (typeof workflows)[number][0];

type WorkflowStep = {
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
};

const workflowSteps: Record<WorkflowName, readonly WorkflowStep[]> = {
  Receive: [
    {
      title: "Scan product",
      description: "Identify the item arriving at the dock.",
      inputLabel: "Product barcode",
      placeholder: "SCAN PRODUCT BARCODE",
    },
    {
      title: "Scan purchase order",
      description: "Match the item to its inbound purchase order.",
      inputLabel: "Purchase order barcode",
      placeholder: "SCAN PURCHASE ORDER",
    },
    {
      title: "Confirm receiving dock",
      description: "Scan the dock location to finish receiving.",
      inputLabel: "Dock location barcode",
      placeholder: "SCAN DOCK LOCATION",
    },
  ],
  Putaway: [
    {
      title: "Scan product",
      description: "Identify the received item to put away.",
      inputLabel: "Product barcode",
      placeholder: "SCAN PRODUCT BARCODE",
    },
    {
      title: "Scan source location",
      description: "Confirm the staging location you are moving from.",
      inputLabel: "Source location barcode",
      placeholder: "SCAN SOURCE LOCATION",
    },
    {
      title: "Scan destination bin",
      description: "Confirm the storage bin and complete putaway.",
      inputLabel: "Destination bin barcode",
      placeholder: "SCAN DESTINATION BIN",
    },
  ],
  Pick: [
    {
      title: "Scan product",
      description: "Identify the order item you are collecting.",
      inputLabel: "Product barcode",
      placeholder: "SCAN PRODUCT BARCODE",
    },
    {
      title: "Confirm source and quantity",
      description: "Scan the source bin and enter the quantity picked.",
      inputLabel: "Source bin barcode",
      placeholder: "SCAN SOURCE BIN",
    },
    {
      title: "Scan destination tote",
      description: "Confirm the order tote or packing station to finish.",
      inputLabel: "Tote or packing station barcode",
      placeholder: "SCAN DESTINATION TOTE",
    },
  ],
  Pack: [
    {
      title: "Scan order tote",
      description: "Identify the picked order ready for packing.",
      inputLabel: "Order tote barcode",
      placeholder: "SCAN ORDER TOTE",
    },
    {
      title: "Verify product",
      description: "Scan the item to verify it belongs in the shipment.",
      inputLabel: "Product barcode",
      placeholder: "SCAN PRODUCT BARCODE",
    },
    {
      title: "Scan shipping container",
      description: "Confirm the carton or label and complete packing.",
      inputLabel: "Container or label barcode",
      placeholder: "SCAN CONTAINER OR LABEL",
    },
  ],
};

type CameraState =
  | "idle"
  | "starting"
  | "active"
  | "denied"
  | "unavailable"
  | "insecure"
  | "timeout"
  | "error";

function cameraErrorMessage(state: CameraState) {
  if (state === "denied")
    return "Camera permission was denied. Allow camera access in browser settings, then try again.";
  if (state === "unavailable")
    return "No usable camera was found. Connect a camera or use the barcode field below.";
  if (state === "insecure")
    return "Camera scanning requires HTTPS on phones and tablets. Open this WMS through a secure HTTPS address, or use a handheld scanner.";
  if (state === "timeout")
    return "The camera permission request timed out. Check the browser permission prompt, then try again.";
  if (state === "error")
    return "The camera could not start. Close other camera apps and try again.";
  return "";
}

export function ScannerWorkflow() {
  const [workflow, setWorkflow] = useState<WorkflowName>("Pick");
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [scans, setScans] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [value, setValue] = useState("");
  const [result, setResult] = useState("");
  const [online, setOnline] = useState(true);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const scannerControls = useRef<IScannerControls | null>(null);
  const cameraAttempt = useRef(0);
  const lastScan = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const steps = workflowSteps[workflow];
  const activeStep = steps[currentStep];

  const stopCamera = useCallback(() => {
    cameraAttempt.current += 1;
    scannerControls.current?.stop();
    scannerControls.current = null;
    const stream = video.current?.srcObject;
    if (stream instanceof MediaStream)
      stream.getTracks().forEach((track) => track.stop());
    if (video.current) video.current.srcObject = null;
    setCameraState("idle");
  }, []);

  const acceptScan = useCallback(
    (rawValue: string, source: "camera" | "scanner" | "manual") => {
      const barcode = rawValue.trim();
      if (!barcode || completed) return;

      const now = Date.now();
      if (
        lastScan.current.value === barcode &&
        now - lastScan.current.at < 1500
      )
        return;
      lastScan.current = { value: barcode, at: now };

      if (source === "camera") {
        stopCamera();
      }
      if ("vibrate" in navigator) navigator.vibrate(60);
      const isLastStep = currentStep === steps.length - 1;
      setScans((previous) => {
        const next = previous.slice(0, currentStep);
        next[currentStep] = barcode;
        return next;
      });
      if (isLastStep) {
        setCompleted(true);
        setResult(`${workflow} workflow completed with ${barcode}.`);
      } else {
        setCurrentStep((step) => step + 1);
        setResult(
          `${activeStep.title} accepted: ${barcode} · ${source}. Continue to step ${currentStep + 2}.`,
        );
      }
      setValue("");
      window.setTimeout(() => input.current?.focus(), 0);
    },
    [activeStep.title, completed, currentStep, steps.length, stopCamera, workflow],
  );

  const resetSession = useCallback(() => {
    stopCamera();
    setCurrentStep(0);
    setCompleted(false);
    setScans([]);
    setQuantity("1");
    setValue("");
    setResult("");
    lastScan.current = { value: "", at: 0 };
    window.setTimeout(() => input.current?.focus(), 0);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    if (!online || cameraState === "starting" || cameraState === "active")
      return;
    if (!window.isSecureContext) {
      setCameraState("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !video.current) {
      setCameraState("unavailable");
      return;
    }

    setResult("");
    setCameraState("starting");
    const attempt = cameraAttempt.current + 1;
    cameraAttempt.current = attempt;
    try {
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 700,
      });
      const mediaRequest = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      void mediaRequest
        .then((lateStream) => {
          if (attempt !== cameraAttempt.current)
            lateStream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => undefined);
      let timeoutId = 0;
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () =>
            reject(
              new DOMException("Camera permission timed out", "TimeoutError"),
            ),
          15000,
        );
      });
      const stream = await Promise.race([mediaRequest, timeout]);
      window.clearTimeout(timeoutId);
      if (attempt !== cameraAttempt.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const controls = await reader.decodeFromStream(
        stream,
        video.current,
        (decoded) => {
          if (decoded) acceptScan(decoded.getText(), "camera");
        },
      );
      if (attempt !== cameraAttempt.current) {
        controls.stop();
        return;
      }
      scannerControls.current = controls;
      setCameraState("active");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError")
        setCameraState("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError")
        setCameraState("unavailable");
      else if (name === "TimeoutError") {
        cameraAttempt.current += 1;
        setCameraState("timeout");
      } else setCameraState("error");
    }
  }, [acceptScan, cameraState, online]);

  useEffect(() => {
    const videoElement = video.current;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    input.current?.focus();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      scannerControls.current?.stop();
      const stream = videoElement?.srcObject;
      if (stream instanceof MediaStream)
        stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online) return;
    acceptScan(value, "manual");
  }

  const cameraError = cameraErrorMessage(cameraState);

  return (
    <section className="scan-card">
      <div className="scan-top">
        <div className="scan-top-row">
          <div>
            <p className="eyebrow">Scanner mode</p>
            <h1>{workflow} workflow</h1>
          </div>
          <span className={`online-pill ${online ? "" : "offline"}`}>
            {online ? "● Online" : "● Offline"}
          </span>
        </div>
        <p>SEL-01 · Seoul Fulfillment Center</p>
      </div>
      <div className="scan-body">
        <div
          className="scan-steps"
          aria-label={completed ? `${workflow} workflow complete` : `Step ${currentStep + 1} of ${steps.length}`}
        >
          {steps.map((step, index) => (
            <div className="scan-step-group" key={step.title}>
              <span
                className={`scan-step ${index === currentStep && !completed ? "active" : ""} ${index < currentStep || completed ? "done" : ""}`}
              >
                {index < currentStep || completed ? "✓" : index + 1}
              </span>
              <small>{step.title}</small>
              {index < steps.length - 1 && (
                <span
                  className={`scan-line ${index < currentStep || completed ? "done" : ""}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="scan-prompt">
          <span>{completed ? "✓" : currentStep + 1}</span>
          <h2>{completed ? `${workflow} complete` : activeStep.title}</h2>
          <p>
            {completed
              ? "All required scans have been confirmed."
              : activeStep.description}
          </p>
        </div>

        <div
          className={`camera-panel ${cameraState === "active" ? "active" : ""}`}
        >
          <video
            ref={video}
            className="camera-video"
            muted
            playsInline
            aria-label="Camera barcode preview"
          />
          {cameraState !== "active" && (
            <div className="camera-placeholder">
              <span>▣</span>
              <strong>Scan with camera</strong>
              <small>QR, EAN, UPC, Code 39 and Code 128</small>
            </div>
          )}
          {cameraState === "active" && (
            <div className="camera-target" aria-hidden="true">
              <span />
            </div>
          )}
        </div>

        <div className="camera-actions">
          {cameraState === "active" ? (
            <button
              className="button button-secondary camera-button"
              type="button"
              onClick={stopCamera}
            >
              Stop camera
            </button>
          ) : (
            <button
              className="button button-primary camera-button"
              type="button"
              onClick={() => void startCamera()}
              disabled={!online || completed || cameraState === "starting"}
            >
              {cameraState === "starting"
                ? "Starting camera…"
                : "Start camera scanner"}
            </button>
          )}
        </div>
        {cameraError && (
          <p className="camera-error" role="alert">
            {cameraError}
          </p>
        )}

        {!completed && <div className="scan-divider">
          <span>or use a handheld scanner</span>
        </div>}
        {!completed && <form onSubmit={submit}>
          <label className="scan-label" htmlFor="barcode-input">
            {activeStep.inputLabel}
          </label>
          <input
            id="barcode-input"
            ref={input}
            className="scan-input"
            aria-label="Barcode"
            placeholder={activeStep.placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (online) acceptScan(value, "scanner");
              }
            }}
            disabled={!online}
          />
          {workflow === "Pick" && currentStep === 1 && (
            <label className="scan-quantity">
              <span>Quantity picked</span>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                aria-label="Quantity picked"
              />
            </label>
          )}
          <div className="scan-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                if (value) {
                  setValue("");
                } else if (currentStep > 0) {
                  setCurrentStep((step) => step - 1);
                  setScans((previous) => previous.slice(0, -1));
                  setResult("Returned to the previous step.");
                }
                input.current?.focus();
              }}
            >
              {value || currentStep === 0 ? "Clear" : "Previous step"}
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={
                !online ||
                !value.trim() ||
                (workflow === "Pick" &&
                  currentStep === 1 &&
                  (!Number.isInteger(Number(quantity)) || Number(quantity) < 1))
              }
            >
              {currentStep === steps.length - 1 ? "Confirm & complete" : "Confirm scan"}
            </button>
          </div>
        </form>}
        {scans.length > 0 && (
          <ol className="scan-summary" aria-label="Confirmed workflow steps">
            {scans.map((scan, index) => (
              <li key={`${index}-${scan}`}>
                <span>✓</span>
                <div>
                  <small>{steps[index].title}</small>
                  <strong>
                    {scan}
                    {workflow === "Pick" && index === 1 ? ` · Qty ${quantity}` : ""}
                  </strong>
                </div>
              </li>
            ))}
          </ol>
        )}
        {result && (
          <div className="scan-result" role="status">
            ✓ {result}
          </div>
        )}
        <p className="scan-hint">
          {completed
            ? "Start another session to process the next item."
            : "Industrial scanners: keep this page open and scan normally. Enter-suffix barcodes submit automatically."}
        </p>
        {completed && (
          <button
            className="button button-primary scan-new-session"
            type="button"
            onClick={resetSession}
          >
            Start another {workflow.toLowerCase()}
          </button>
        )}
        <div className="workflow-picker">
          {workflows.map(([name, description]) => (
            <button
              key={name}
              type="button"
              className={`workflow-option ${workflow === name ? "selected" : ""}`}
              onClick={() => {
                setWorkflow(name);
                stopCamera();
                setCurrentStep(0);
                setCompleted(false);
                setScans([]);
                setQuantity("1");
                setValue("");
                setResult("");
                lastScan.current = { value: "", at: 0 };
                window.setTimeout(() => input.current?.focus(), 0);
              }}
            >
              <strong>{name}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
