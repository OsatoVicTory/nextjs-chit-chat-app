"use client";

import { EmojiJsonType } from "@/components/types";
import emoji_json from "@/public/emoji.json";
// import { StaticImageData } from "next/image";

// const images: { [key: number]: StaticImageData } = { 1: image1, 2: image2, 3: image3, 4: image4, 5: image5, 6: image6, 7: image7, 8: image8 };
const images: { [key: number]: string } = { 
    1: "/emojis-bg-1.png", 
    2: "/emojis-bg-2.png", 
    3: "/emojis-bg-3.png", 
    4: "/emojis-bg-4.png", 
    5: "/emojis-bg-5.png", 
    6: "/emojis-bg-6.png", 
    7: "/emojis-bg-7.png", 
    8: "/emojis-bg-8.png",
};



export const getEmojiStyles = (emoji : string, desired_px = 18) => {
    const lego_dim = 34 * 14;
    const lego_length = 34;
    const lego_height = 14;
    const e : Record<string, EmojiJsonType> = emoji_json;
    const index = e[emoji]?.index; 
    // const indexOffset = (index - 0) + 1;
    // const page = Math.floor(indexOffset / lego_dim);
    // const num = (indexOffset % lego_dim == 0 && indexOffset) ? lego_dim - 1 : (indexOffset % lego_dim) - 1;
    // const left = num && !(num % 34) ? 34 : num % 34;
    // const width = Math.ceil(desired_px * 1.373125);
    // const height = Math.ceil(desired_px * 1.333333);
    // const pos = `-${left * width}px -${Math.floor(num / 34) * height}px`;
    // const backgroundSize = `${34 * width}px ${(page < 8 ? 14 : 9) * height}px`;
    
    // return { 
    //     fontSize: `${desired_px}px`, backgroundSize,
    //     width: `${width}px`, height: `${height}px`, display: "inline-block",
    //     backgroundImage: `url(${images[page]})`, backgroundPosition: pos,  
    // };

    const indexOffset = (index - 0);
    const page = Math.floor(indexOffset / lego_dim) + 1;
    const rem = indexOffset % lego_dim;
    const left = rem % lego_length; // > 0 ? rem % lego_length : (rem > 0 ? lego_length : 0);
    const top = Math.floor(rem / lego_length);

    const width = Math.ceil(desired_px * 1.353229);
    const height = width; // so height and width has same dimension
    // const bg_right_pad = Math.round((18.9 * width) / 93);
    const bg_height = (page < 8 ? lego_height : 9);
    const pos = `-${(left * width)}px -${(top * height)}px`;
    const backgroundSize = `${(lego_length * width)}px ${(bg_height * height)}px`;

    // const pos = `-${(left * width) + left - (0.25 * left)}px -${(top * height) + top}px`;
    // const backgroundSize = `${(lego_length * width) + bg_right_pad + lego_length - 1}px ${(bg_height * height) + bg_height - 1}px`;
    return { 
        fontSize: `${desired_px}px`, backgroundSize,
        width: `${width}px`, height: `${height}px`, display: "inline-block",
        backgroundImage: `url(${images[page]})`, backgroundPosition: pos,  
    };
};

export const getAllEmojis = () => {
    const e : Record<string, EmojiJsonType> = emoji_json;
    return Object.keys(e);
};

export const searchEmoji = (str: string) => {
    const e : Record<string, EmojiJsonType> = emoji_json;
    const res : string[] = [];
    Object.keys(e).forEach(key => {
        if(e[key].name.find(_name => _name.startsWith(str))) res.push(key);
    });
    return res;
};