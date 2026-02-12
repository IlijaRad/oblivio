"use client";

import { calls, CallState, IncomingOffer } from "@/lib/calls";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface CallContextValue {
  callState: CallState;
  incoming: IncomingOffer | null;
  setIncoming: (offer: IncomingOffer | null) => void;
  remoteRef: React.RefObject<HTMLVideoElement | null>;
  localRef: React.RefObject<HTMLVideoElement | null>;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside CallProvider");
  return ctx;
}

export function CallProvider({
  children,
  token,
}: {
  children: ReactNode;
  token?: string;
}) {
  const [callState, setCallState] = useState<CallState>({
    active: false,
    connected: false,
    hasVideo: false,
    micMuted: false,
    cameraOn: false,
    callId: null,
    withUserId: null,
  });
  const [incoming, setIncoming] = useState<IncomingOffer | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (token) calls.setToken(token);
  }, [token]);

  useEffect(() => {
    calls.setIncomingHandler((offer) => setIncoming(offer));

    const onStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<CallState>;
      setCallState(customEvent.detail);
    };

    const onAccepted = () => setIncoming(null);

    window.addEventListener("calls:accepted", onAccepted);
    window.addEventListener("calls:state", onStateChange);

    return () => {
      window.removeEventListener("calls:accepted", onAccepted);
      window.removeEventListener("calls:state", onStateChange);
    };
  }, []);

  useEffect(() => {
    if (!callState.active) return;
    const r = remoteRef.current;
    const l = localRef.current || undefined;
    if (r) calls.attachElements(r, l);
  }, [callState.active]);

  return (
    <CallContext.Provider
      value={{ callState, incoming, setIncoming, remoteRef, localRef }}
    >
      {children}
    </CallContext.Provider>
  );
}
