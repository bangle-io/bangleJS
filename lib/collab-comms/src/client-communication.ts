import { CollabMessageBus, MessageType } from './collab-message-bus';
import {
  CollabFail,
  CollabRequest,
  CollabRequestGetDocument,
  CollabRequestPullEvents,
  CollabRequestPushEvents,
  CollabRequestType,
  NetworkingError,
} from './common';
import { wrapRequest } from './wrap-request';

type MakeRequest<R extends CollabRequest> = (
  body: R['request']['body'],
) => Promise<R['response']>;

export class ClientCommunication {
  public getDocument: MakeRequest<CollabRequestGetDocument> = (body) => {
    let request = {
      type: CollabRequestType.GetDocument as const,
      body,
    };
    return this._wrapRequest(CollabRequestType.GetDocument, request);
  };

  public pullEvents: MakeRequest<CollabRequestPullEvents> = (body) => {
    const request: CollabRequestPullEvents['request'] = {
      type: CollabRequestType.PullEvents,
      body,
    };
    return this._wrapRequest(CollabRequestType.PullEvents, request);
  };

  public pushEvents: MakeRequest<CollabRequestPushEvents> = (body) => {
    const request: CollabRequestPushEvents['request'] = {
      type: CollabRequestType.PushEvents,
      body,
    };
    return this._wrapRequest(CollabRequestType.PushEvents, request);
  };

  public managerId: string;

  constructor(
    private _opts: {
      clientId: string;
      managerId: string;
      messageBus: CollabMessageBus;
      signal: AbortSignal;
      requestTimeout?: number;
    },
  ) {
    this.managerId = this._opts.managerId;

    const removeListener = this._opts.messageBus?.receiveMessages(
      this._opts.clientId,
      (message) => {
        switch (message.type) {
          case MessageType.BROADCAST: {
            return;
          }
          case MessageType.PONG: {
            return;
          }
          case MessageType.PING: {
            return;
          }
        }
      },
    );

    this._opts.signal.addEventListener(
      'abort',
      () => {
        removeListener();
      },
      { once: true },
    );
  }

  private async _wrapRequest<T extends CollabRequestType>(
    type: T,
    request: Extract<CollabRequest, { type: T }>['request'],
  ): Promise<
    | Extract<CollabRequest, { type: T }>['response']
    | {
        body: CollabFail;
        type: T;
        ok: false;
      }
  > {
    try {
      return (await wrapRequest(request, {
        from: this._opts.clientId,
        to: this.managerId,
        emitter: this._opts.messageBus,
        requestTimeout: this._opts.requestTimeout,
      })) as any;
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message as NetworkingError;
        switch (message) {
          case NetworkingError.Timeout: {
            return {
              body: CollabFail.ManagerUnresponsive,
              type,
              ok: false,
            };
          }
          default: {
            let val: never = message;
            throw error;
          }
        }
      }
      throw error;
    }
  }
}
