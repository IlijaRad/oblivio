import { Centrifuge, Subscription } from "centrifuge";
import { Message } from "./definitions";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

let centrifuge: Centrifuge | null = null;
let subscription: Subscription | null = null;

export function connectWebSocket(token: string) {
  if (!WEBSOCKET_URL) {
    throw new Error("WEBSOCKET_URL is not defined");
  }

  if (centrifuge) return centrifuge;

  centrifuge = new Centrifuge(WEBSOCKET_URL, { token });
  centrifuge.connect();

  return centrifuge;
}

export function subscribeUserChannel(
  userId: string,
  onMessage: (
    data: Message & { with: number; type: string; upTo: number },
  ) => void,
) {
  if (!centrifuge) return;

  if (subscription) return;

  const channel = `conversation.${userId}`;
  subscription = centrifuge.newSubscription(channel);

  subscription.on("publication", (ctx) => {
    onMessage(ctx.data);
  });

  subscription.subscribe();
}

export function disconnectWebSocket() {
  subscription?.unsubscribe();
  subscription = null;

  centrifuge?.disconnect();
  centrifuge = null;
}
