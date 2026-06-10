import {Server} from "rpc-websockets";

export interface ILogServer {
    start(): Promise<void>;
}