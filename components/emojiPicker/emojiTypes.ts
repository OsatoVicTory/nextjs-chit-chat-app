export interface vType {
    emoji: string,
    code: string,
    index: number,
    img_url: string
}

export interface emojiSkinTonesType { 
    emoji: string, 
    emojis: vType[], 
    style: Record<string, string>,
    tick : Record<string, string>,
};

export interface emojiDataType extends vType {
    v?: vType[] | undefined,
    name?: string[] | undefined
}

export interface list {
    emoji: string,
    code: string,
    index: number,
    img_url: string,
    name?: string[] | undefined,
    v?: vType[] | undefined
}

export interface emojiListsType {
    title: string,
    lists: list[]
}