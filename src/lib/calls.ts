export interface CallState {
  active: boolean;
  connected: boolean;
  hasVideo: boolean;
  micMuted: boolean;
  cameraOn: boolean;
  callId: string | null;
  withUserId: string | null;
  ice?: string;
  gathering?: string;
  selectedPair?: {
    localType: string;
    remoteType: string;
  };
}

export interface RawIceItem {
  candidate: RTCIceCandidateInit | string | undefined;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

interface CallIceBatchPayload {
  type: "call-ice-batch";
  callId: string;
  fromUserId: string;
  items: Array<RawIceItem>;
}

export interface RawIceCandidate {
  candidate: RTCIceCandidateInit | string | undefined;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface IncomingOffer {
  callId: string;
  fromUserId: string;
  offer: string;
  hasVideo: boolean;
}
export interface CallOfferPayload {
  type: "call-offer";
  callId: string;
  fromUserId: string;
  sdp: {
    type: string;
    sdp: string;
  };
  hasVideo: boolean;
}
export interface CallAnswerPayload {
  type: "call-answer";
  callId: string;
  fromUserId: string;
  sdp: {
    type: string;
    sdp: string;
  };
}

export interface CallIcePayload {
  type: "call-ice" | "ice-candidate";
  callId: string;
  fromUserId: string;
  candidate: RawIceCandidate;
}
interface CallEndPayload {
  type: "call-end" | "call-cancel";
  callId: string;
  fromUserId?: string;
}
export type CallPayload =
  | CallOfferPayload
  | CallAnswerPayload
  | CallIcePayload
  | CallIceBatchPayload
  | CallEndPayload;

class CallsManager {
  private pc: RTCPeerConnection | null = null;
  private token: string | null = null;
  private iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ];
  private localStream: MediaStream | null = null;
  private remoteVideo: HTMLVideoElement | null = null;
  private localVideo: HTMLVideoElement | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];
  private callId: string | null = null;
  private withUserId: string | null = null;
  private hasVideo: boolean = false;
  private incomingHandler: ((offer: IncomingOffer) => void) | null = null;
  private iceBatchTimeout: NodeJS.Timeout | null = null;
  private iceBatchQueue: Array<{
    candidate: RTCIceCandidateInit;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  }> = [];

  constructor() {
    this.setupEventListeners();
  }

  async refreshIceConfig() {
    if (!this.token) return;
    try {
      const response = await this.clientApiClient("/calls/ice-config", {
        method: "GET",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.iceServers) {
          this.iceServers = data.iceServers;
        }
      } else {
        console.error("ICE Config fetch failed:", response.status);
      }
    } catch (error) {
      console.error("Network error fetching ICE config:", error);
    }
  }

  setToken(token: string) {
    this.token = token;
    this.refreshIceConfig();
  }

  private setupEventListeners() {
    window.addEventListener("calls:answer", ((e: Event) => {
      this.handleAnswer(e as CustomEvent<CallAnswerPayload>);
    }) as EventListener);
    window.addEventListener("calls:ice", ((e: Event) => {
      this.handleIceCandidate(e as CustomEvent<CallIcePayload>);
    }) as EventListener);
    window.addEventListener("calls:ice-batch", ((e: Event) => {
      this.handleIceBatch(e as CustomEvent<CallIceBatchPayload>);
    }) as EventListener);
    window.addEventListener("calls:end", (() => {
      this.handleCallEnd();
    }) as EventListener);
  }

  private async handleIceBatch(event: CustomEvent<CallIceBatchPayload>) {
    const { items } = event.detail;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const raw = item as RawIceItem;
      const candInit: RTCIceCandidateInit = {
        candidate:
          typeof raw.candidate === "string"
            ? raw.candidate
            : (raw.candidate?.candidate ?? ""),
        sdpMid:
          raw.sdpMid ??
          (typeof raw.candidate !== "string" ? raw.candidate?.sdpMid : null) ??
          null,
        sdpMLineIndex:
          raw.sdpMLineIndex ??
          (typeof raw.candidate !== "string"
            ? raw.candidate?.sdpMLineIndex
            : null) ??
          null,
        usernameFragment:
          raw.usernameFragment ??
          (typeof raw.candidate !== "string"
            ? raw.candidate?.usernameFragment
            : null) ??
          null,
      };
      if (!candInit.candidate) {
        console.warn("ICE batch item has no candidate string", raw);
        continue;
      }
      const candidate = new RTCIceCandidate(candInit);
      if (this.pc && this.pc.remoteDescription?.type) {
        try {
          await this.pc.addIceCandidate(candidate);
        } catch (e) {
          console.error("addIceCandidate failed", e, candInit);
        }
      } else {
        this.pendingCandidates.push(candidate);
      }
    }
  }

  setIncomingHandler(handler: (offer: IncomingOffer) => void) {
    this.incomingHandler = handler;
  }

  async handleIncoming(payload: CallPayload) {
    const eventMap: Record<string, string> = {
      "call-answer": "calls:answer",
      "call-ice": "calls:ice",
      "ice-candidate": "calls:ice",
      "call-ice-batch": "calls:ice-batch",
      "call-end": "calls:end",
      "call-cancel": "calls:end",
    };
    if (payload.type === "call-offer") {
      this.callId = payload.callId;
      this.withUserId = payload.fromUserId;
      this.incomingHandler?.({
        callId: payload.callId,
        fromUserId: payload.fromUserId,
        offer: payload.sdp.sdp,
        hasVideo: payload.hasVideo,
      });
    } else {
      if (!this.callId || payload.callId === this.callId) {
        const eventName = eventMap[payload.type];
        if (eventName) {
          window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
        }
      }
    }
  }
  private queueIceCandidate(candidate: RTCIceCandidateInit) {
    const item = {
      candidate: candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    };
    this.iceBatchQueue.push(item);
    if (!this.iceBatchTimeout) {
      this.iceBatchTimeout = setTimeout(() => {
        this.sendIceBatch();
      }, 200);
    }
  }

  private async sendIceBatch() {
    if (this.iceBatchQueue.length === 0 || !this.callId || !this.withUserId) {
      this.iceBatchTimeout = null;
      return;
    }
    const itemsToSend = [...this.iceBatchQueue];
    this.iceBatchQueue = [];
    this.iceBatchTimeout = null;
    try {
      await this.clientApiClient("/calls/ice-batch", {
        method: "POST",
        body: JSON.stringify({
          callId: this.callId,
          toUserId: this.withUserId,
          items: itemsToSend,
        }),
      });
    } catch (error) {
      console.error("Failed to send ICE batch:", error);
    }
  }

  private async clientApiClient(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }
  private emitState() {
    const state: CallState = {
      active: !!this.pc,
      connected: this.pc?.connectionState === "connected",
      hasVideo: this.hasVideo,
      micMuted: this.localStream?.getAudioTracks()[0]?.enabled === false,
      cameraOn: this.localStream?.getVideoTracks()[0]?.enabled === true,
      callId: this.callId,
      withUserId: this.withUserId,
      ice: this.pc?.iceConnectionState,
      gathering: this.pc?.iceGatheringState,
    };
    if (this.pc) {
      this.pc.getStats().then((stats) => {
        stats.forEach((report) => {
          if (
            report.type === "candidate-pair" &&
            (report as RTCIceCandidatePairStats).state === "succeeded"
          ) {
            const pairStats = report as RTCIceCandidatePairStats;
            state.selectedPair = {
              localType: pairStats.localCandidateId || "unknown",
              remoteType: pairStats.remoteCandidateId || "unknown",
            };
          }
        });
        window.dispatchEvent(new CustomEvent("calls:state", { detail: state }));
      });
    } else {
      window.dispatchEvent(new CustomEvent("calls:state", { detail: state }));
    }
  }

  async startCall(toUserId: string, video: boolean = false): Promise<void> {
    try {
      this.withUserId = toUserId;
      this.hasVideo = video;
      this.callId = `call_${Math.random().toString(36).substring(2, 15)}`;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video,
      });
      this.localStream = stream;
      this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.pc.onconnectionstatechange = () => {
        this.emitState();
      };
      this.pc.oniceconnectionstatechange = () => {
        this.emitState();
      };
      this.localStream
        .getTracks()
        .forEach((t) => this.pc!.addTrack(t, this.localStream!));
      this.pc.onicecandidate = (e) => {
        if (e.candidate) this.queueIceCandidate(e.candidate.toJSON());
      };
      this.pc.ontrack = (e) => {
        if (this.remoteVideo && e.streams[0])
          this.remoteVideo.srcObject = e.streams[0];
      };
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await this.clientApiClient("/calls/offer", {
        method: "POST",
        body: JSON.stringify({
          callId: this.callId,
          toUserId: toUserId,
          sdp: offer,
          hasVideo: video,
        }),
      });
      this.emitState();
    } catch (error) {
      console.error("Start call failed:", error);
      this.cleanup();
      throw error;
    }
  }
  async acceptOffer(offer: IncomingOffer): Promise<void> {
    try {
      this.callId = offer.callId;
      this.withUserId = offer.fromUserId;
      this.hasVideo = offer.hasVideo;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.hasVideo,
      });
      this.localStream = stream;
      this.pc = new RTCPeerConnection({
        iceServers: this.iceServers,
      });
      this.pc.onconnectionstatechange = () => {
        this.emitState();
      };
      this.pc.oniceconnectionstatechange = () => {
        this.emitState();
      };
      this.localStream
        .getTracks()
        .forEach((t) => this.pc!.addTrack(t, this.localStream!));
      this.pc.onicecandidate = (e) => {
        if (e.candidate) this.queueIceCandidate(e.candidate.toJSON());
      };
      this.pc.ontrack = (e) => {
        if (this.remoteVideo && e.streams[0])
          this.remoteVideo.srcObject = e.streams[0];
      };
      await this.pc.setRemoteDescription(
        new RTCSessionDescription({
          type: "offer",
          sdp: offer.offer,
        }),
      );
      for (const cand of this.pendingCandidates) {
        await this.pc.addIceCandidate(cand).catch(console.warn);
      }
      this.pendingCandidates = [];
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      await this.clientApiClient("/calls/answer", {
        method: "POST",
        body: JSON.stringify({
          callId: this.callId,
          toUserId: this.withUserId,
          sdp: {
            type: answer.type,
            sdp: answer.sdp,
          },
        }),
      });
      this.emitState();
      window.dispatchEvent(new Event("calls:accepted"));
    } catch (error) {
      console.error("Accept offer failed:", error);
      this.cleanup();
      throw error;
    }
  }

  private async handleAnswer(event: CustomEvent<CallAnswerPayload>) {
    const { sdp } = event.detail;
    if (!this.pc) {
      console.warn("No peer connection for answer");
      return;
    }
    if (this.pc.signalingState === "stable") {
      return;
    }
    try {
      await this.pc.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: sdp.sdp,
        }),
      );
      for (const candidate of this.pendingCandidates) {
        await this.pc.addIceCandidate(candidate);
      }
      this.pendingCandidates = [];
      this.emitState();
      window.dispatchEvent(new Event("calls:accepted"));
    } catch (error) {
      console.error("Failed to handle answer:", error);
      this.endCall("answer failed");
    }
  }

  private async handleIceCandidate(event: CustomEvent<CallIcePayload>) {
    const raw = event.detail.candidate as RawIceCandidate;
    if (!raw) return;
    const candInit: RTCIceCandidateInit = {
      candidate:
        typeof raw.candidate === "string"
          ? raw.candidate
          : (raw.candidate?.candidate ?? ""),
      sdpMid:
        raw.sdpMid ??
        (typeof raw.candidate !== "string" ? raw.candidate?.sdpMid : null) ??
        null,
      sdpMLineIndex:
        raw.sdpMLineIndex ??
        (typeof raw.candidate !== "string"
          ? raw.candidate?.sdpMLineIndex
          : null) ??
        null,
      usernameFragment:
        raw.usernameFragment ??
        (typeof raw.candidate !== "string"
          ? raw.candidate?.usernameFragment
          : null) ??
        null,
    };
    if (!candInit.candidate) return;
    const candidate = new RTCIceCandidate(candInit);
    if (
      this.pc &&
      this.pc.remoteDescription &&
      this.pc.remoteDescription.type
    ) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (e) {
        console.error("ICE: Add failed", e);
      }
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  private handleCallEnd() {
    this.cleanup();
    window.dispatchEvent(new Event("calls:stopRinging"));
  }

  async endCall(reason: string): Promise<void> {
    if (this.callId && this.withUserId) {
      try {
        await this.clientApiClient("/calls/end", {
          method: "POST",
          body: JSON.stringify({
            callId: this.callId,
            toUserId: this.withUserId,
          }),
        });
      } catch (error) {
        console.error("Failed to send end signal:", error);
      }
    }
    this.cleanup();
    window.dispatchEvent(new Event("calls:stopRinging"));
  }

  private cleanup() {
    if (this.iceBatchTimeout) {
      clearTimeout(this.iceBatchTimeout);
      this.iceBatchTimeout = null;
    }
    this.iceBatchQueue = [];
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    if (this.remoteVideo) this.remoteVideo.srcObject = null;
    if (this.localVideo) this.localVideo.srcObject = null;
    this.callId = null;
    this.withUserId = null;
    this.pendingCandidates = [];
    this.emitState();
  }

  attachElements(remote: HTMLVideoElement, local?: HTMLVideoElement) {
    this.remoteVideo = remote;
    this.localVideo = local || null;

    if (this.localStream && this.localVideo) {
      this.localVideo.srcObject = this.localStream;
    }
  }

  toggleMic() {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.emitState();
    }
  }

  toggleCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.emitState();
    }
  }

  async listAudioOutputs(): Promise<
    Array<{ deviceId: string; label: string }>
  > {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || "Speaker" }));
    } catch {
      return [];
    }
  }

  async setOutputDevice(deviceId: string) {
    if (!this.remoteVideo) return;

    try {
      if (
        "setSinkId" in this.remoteVideo &&
        typeof this.remoteVideo.setSinkId === "function"
      ) {
        await this.remoteVideo.setSinkId(deviceId);
      }
    } catch (error) {
      console.error("Failed to set output device:", error);
    }
  }
}

export const calls = new CallsManager();
