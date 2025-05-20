"use client";

import { getEmojiStyles } from "@/app/util/_emoji_render";
import styles from "./picker.module.css";

export default function EmojiRender({ emoji, size } : { emoji: string, size: number}) {
    return (
        <span className={styles.emojiRender}>
            <span className={styles.emoji_span} style={getEmojiStyles(emoji, size)}>{emoji}</span>
        </span>
    )
}