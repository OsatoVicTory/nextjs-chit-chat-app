"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './picker.module.css'; 
import { HiOutlineLightBulb } from 'react-icons/hi';
import { BsFlag, BsEmojiSmile, BsCup } from 'react-icons/bs';
import { AiFillCar } from 'react-icons/ai';
import { CgHashtag } from 'react-icons/cg';
import { TbDog } from 'react-icons/tb';
import { MdSportsVolleyball } from 'react-icons/md';
import EmojiPickerContents from './contents';
import { mountFnc, scrollFn, searchFnc, getEmojiSkintonesModalPositions } from './utils';
import EmojiRender from './renderer';
import { emojiDataType, emojiSkinTonesType, list } from './emojiTypes';

type emojiClickType = (str: string) => void;

type emojiSplice = { title: string, lists: list[][] };

export default function EmojiPicker({ emojiClick } : { emojiClick: emojiClickType }) {
    const eleRef = useRef<HTMLDivElement | null>(null);
    const elements = useRef<Element[]>([]);
    const [emojiLists, setEmojiLists] = useState<emojiSplice[]>([]);
    const [emojiListsShowing, setEmojiListsShowing] = useState<emojiSplice[]>([]);
    const [offsetWidth, setOffsetWidth] = useState<number>(window.innerWidth - (window.innerWidth >= 1000 ? 521 : 0));
    const [current, setCurrent] = useState<number>(0);
    const indexRef = useRef<number>(0);
    const skinTonesRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<string>('not_loaded');
    const [emojiSkinTones, setEmojiSkinTones] = useState<emojiSkinTonesType | null>(null);

    const handleResize = useCallback(() => {
        const ele = document.getElementById("EM-picker");
        if(ele) setOffsetWidth(ele.getBoundingClientRect().width);
    }, []);

    useEffect(() => {
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const scrollFnc = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const setter = (val: number) => {
            indexRef.current = val;
            setCurrent(val);
        }
        scrollFn(
            e, elements.current, indexRef.current, 
            emojiSkinTones?.emoji, setter, setEmojiSkinTones
        );
    }, [emojiSkinTones?.emoji]);

    useEffect(() => { 
        if(offsetWidth) mountFnc(offsetWidth, setEmojiLists, setEmojiListsShowing, setState);
    }, [offsetWidth]);

    useEffect(() => {
        if(state !== 'not_loaded') {
            const eles = Array.from(document.getElementsByClassName('Epm_list_title'));
            if(eles) elements.current = eles;
        }
    }, [state]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if(value) {
            if(state !== 'search') setState('search');
            if(current !== 0) setCurrent(0);
            searchFnc(value.toLowerCase(), offsetWidth, setEmojiListsShowing);
        } else {
            setEmojiListsShowing(emojiLists);
            setState('view_full_lists');
        }
    }, [state, current, offsetWidth]);

    const handleEmojiClick = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>, emojiData: emojiDataType) => {
        if(emojiData?.v) {
            const { pos, tick } = getEmojiSkintonesModalPositions(e.currentTarget, 240);
            setEmojiSkinTones({ emoji: 'true', emojis: emojiData.v, style: pos, tick });
        } else {
            emojiClick(emojiData.emoji);
            if(emojiSkinTones?.emoji) setEmojiSkinTones(null);
        }
    }, [emojiSkinTones?.emoji]);

    const clickFnc = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

        if(!skinTonesRef.current) return;
        
        if(skinTonesRef.current && !skinTonesRef.current.contains(e.currentTarget)) {
            setEmojiSkinTones(null);
        };
    }, []);

    const scrollerFnc = useCallback((idx: number) => {
        if(!elements.current) return;
        let i = 0;
        for(const ele of elements.current) {
            if(i === idx) {
                indexRef.current = idx;
                setCurrent(idx);
                ele.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            i++;
        }
    }, []);

    return (
        <div className={styles.Emoji_Picker} id='EM-picker' onClick={clickFnc}>
            <span>
                {emojiSkinTones?.emoji && <div className={`${styles.Ep__skintones} hide_scroll_bar`} 
                style={{...emojiSkinTones.style}} ref={skinTonesRef}>
                    <span className={styles.Ep_skintones_tick} style={{...emojiSkinTones.tick}}></span>
                    {emojiSkinTones.emojis.map((val, idx) => (
                        <div className={styles.Ep_skintones_div} key={`ep-skintones-${idx}`}
                        onClick={(e) => handleEmojiClick(e, val)}>
                            <EmojiRender emoji={val.emoji} size={25} />
                        </div>
                    ))}
                </div>}
            </span>
            <div className={styles.Emoji_picker}>
                <div className={styles.Emoji_picker_header}>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===0}`]}`}
                    onClick={() => scrollerFnc(0)}>
                        <BsEmojiSmile className='Eph-icon adjust' />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===1}`]}`}
                    onClick={() => scrollerFnc(1)}>
                        <TbDog className={styles.Eph_icon} />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===2}`]}`}
                    onClick={() => scrollerFnc(2)}>
                        <BsCup className={styles.Eph_icon} />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===3}`]}`}
                    onClick={() => scrollerFnc(3)}>
                        <MdSportsVolleyball className={styles.Eph_icon} />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===4}`]}`}
                    onClick={() => scrollerFnc(4)}>
                        <AiFillCar className={styles.Eph_icon} />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===5}`]}`}
                    onClick={() => scrollerFnc(5)}>
                        <HiOutlineLightBulb className={styles.Eph_icon} />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===6}`]}`}
                    onClick={() => scrollerFnc(6)}>
                        <CgHashtag className={styles.Eph_icon} />
                    </div>
                    <div className={`${styles.Eph} ${styles[`Eph_${current===7}`]}`}
                    onClick={() => scrollerFnc(7)}>
                        <BsFlag className={`${styles.Eph_icon} ${styles.adjust}`} />
                    </div>
                </div>
                <div className={styles.Emoji_picker_main}>
                    <div className={styles.Epm_search}>
                        <input placeholder='Search emoji' onChange={handleChange} />
                    </div>
                    <div className={`${styles.Epm_full_lists} hide_scroll_bar`} onScroll={scrollFnc}>
                        <EmojiPickerContents state={state} 
                        handleEmojiClick={handleEmojiClick}
                        rowLength={Math.floor((offsetWidth||300) / 42)}
                        emojiListsShowing={emojiListsShowing} />
                    </div>
                </div>
            </div>
        </div>
    )
};
