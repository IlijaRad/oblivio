"use client";

import { calls } from "@/lib/calls";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useCall } from "./call-provider";
import IncomingCall from "./incoming-call";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CallOverlay({
  getCallerName,
}: {
  getCallerName?: (userId: string) => string;
}) {
  const { callState, incoming, setIncoming, remoteRef, localRef } = useCall();
  const isClient = useIsClient();

  if (!isClient) return null;

  const callerName = incoming
    ? (getCallerName?.(incoming.fromUserId) ?? incoming.fromUserId)
    : "";

  const activeCallerName = callState.withUserId
    ? (getCallerName?.(callState.withUserId) ?? callState.withUserId)
    : "";

  return (
    <>
      {incoming &&
        createPortal(
          <IncomingCall
            type={incoming.hasVideo ? "video" : "audio"}
            callerName={callerName}
            onAccept={async () => {
              try {
                await calls.acceptOffer(incoming);
                setIncoming(null);
              } catch (e) {
                console.error(e);
                toast.error("Failed to accept call");
              }
            }}
            onReject={() => setIncoming(null)}
            onToggle={() => {}}
          />,
          document.body,
        )}

      {callState.active &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-black z-[2000] flex flex-col"
          >
            <div className="relative w-full h-full">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {callState.hasVideo && (
                <video
                  ref={localRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute right-4 bottom-20 w-40 h-30 object-cover rounded-lg border-2 border-white/60"
                />
              )}
              <div className="absolute top-4 left-4 text-white bg-black/40 px-3 py-2 rounded-lg">
                <div>{callState.connected ? "Connected" : "Connecting..."}</div>
                <div className="text-sm opacity-80">{activeCallerName}</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-6">
                <button
                  onClick={() => calls.toggleMic()}
                  className={`px-6 py-3 rounded-full ${callState.micMuted ? "bg-red-500" : "bg-gray-700"} text-white`}
                >
                  {callState.micMuted ? "Unmute" : "Mute"}
                </button>
                {callState.hasVideo && (
                  <button
                    onClick={() => calls.toggleCamera()}
                    className={`px-6 py-3 rounded-full ${callState.cameraOn ? "bg-gray-700" : "bg-red-500"} text-white`}
                  >
                    {callState.cameraOn ? "Camera Off" : "Camera On"}
                  </button>
                )}
                <button
                  onClick={() => calls.endCall("hangup")}
                  className="px-6 py-3 rounded-full bg-red-600 text-white"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
