import { SignalData } from "simple-peer";

export interface RingingType {
    callerId: string, 
    receiverId: string, 
    signal: SignalData, 
    type: string, 
    callerName: string, 
    to: string,
    accepted: boolean,
};

export interface CallingType {
    receiverId: string,
    receiverName: string,
};

export interface ChatListType {
    userName: string, 
    unread: number, 
    _i: number,
    chat: MessageType[], 
    socketId: string,
    lastSeen: string,
    isTyping: boolean,
};

export type sendMessageType = (str: string, aduio?: Blob, audioDuration?: number) => void;

export interface UserType {
    userName: string,
    socketId: string,
    lastSeen: string,
    user_id: string,
}

export const DEFAULT_USER = {
    userName: "",
    socketId: "",
    lastSeen: "",
    user_id: "",
};

export interface MessageType {
    sender: string,
    receiver: string,
    message: string,
    call: string,
    callDuration: number,
    audio?: Blob,
    audioDuration: number,
    date: number,
    read: boolean,
    deleted: boolean,
    messageId: string, // use uuid for it to help identify messages to mark as read
}

export const DEFAULT_MESSAGE = {
    sender: "",
    receiver: "",
    message: "",
    audio: undefined,
    audioDuration: 0,
    call: "",
    callDuration: 0,
    date: 0,
    read: false,
    messageId: "", 
    deleted: false,
};

export interface EmojiJsonType {
    code: string,
    index: number,
    name: string[],
}

type socketfn = (data: any) => void;

export interface NewMessageType extends MessageType {
    userSocketId?: string | undefined, // deleter or reader socketId
    isTyping?: boolean | undefined,
}

export interface ServerToClientEvents {
    // userOnline: (data: UserType) => void,
    // sendMessage: (data: MessageType) => void,
    // readMessage: (sender: string, messageId: string) => void,
    on: (event: string, arg1 : socketfn) => void,
}