"use client";

import styles from './picker.module.css'; 
import { MdOutlineArrowRight } from 'react-icons/md';
import EmojiRender from './renderer';
import { emojiDataType, list } from './emojiTypes';

type emoji = { title: string, lists: list[][] };
type click = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, emojiData: emojiDataType) => void;

export default function EmojiPickerContents(
    { state, emojiListsShowing, handleEmojiClick, rowLength } :
    { state: string, emojiListsShowing: emoji[], handleEmojiClick: click, rowLength: number}
) {
    if(state === 'not_loaded') {
        return (<div className={styles.Emoji_picker_contents}>
            <span className='txt-17 grey'>Loading...</span>
        </div>)
    } else {
        return (<div className={styles.Emoji_picker_contents}>
        {emojiListsShowing.map((rows, index) => (
            <div className={styles.Epm_list} key={`epm_list-${index}`}>

                {rows.title && <div className={styles.Epm_list_title}>
                {rows.title.replace('_', ' & ')}</div>}

                <div className={styles.Epm_list_rows} style={{marginTop: '6px'}}>
                    {rows.lists.map((row, idx) => (
                        <div className={styles.Epm_list_row} key={`epm-row-${idx}`}
                        style={{justifyContent: row.length >= rowLength ? 'space-between':'unset' }}>
                            {row.map((item, i) => (
                                <div className={styles.Epm_list_row_item} key={`Elr-${i}`}
                                onClick={(e) => handleEmojiClick(e, item)}>
                                    <EmojiRender emoji={item.emoji} size={22.8} />
                                    {item.v && <MdOutlineArrowRight className={styles.Epm_icon} />}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        ))}
        </div>)
    }
};
