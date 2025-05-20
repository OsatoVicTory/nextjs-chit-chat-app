import React from 'react';
import emoji_lists from '../../public/emoji_lists.json';
import { emojiSkinTonesType, list } from './emojiTypes';

type emoji = { title: string, lists: list[][] };

export const spliceArray = (rowLength: number) => {
    const res: emoji[] = [];
    for(let list of emoji_lists) {
        const obj: emoji = { title: list.title, lists: [] };
        const { lists } = list;
        const objArray = [];
        let i = 0;
        while(i < lists.length) {
            objArray.push(lists.slice(i, i + rowLength));
            i += rowLength;
        }
        obj.lists = objArray;
        res.push(obj);
    }
    return res;
};

export const mountFnc = (
    offsetWidth: number, setEmojiLists: React.Dispatch<emoji[]>, 
    setEmojiListsShowing: React.Dispatch<emoji[]>, setState: React.Dispatch<string>
) => {
    const rowLength = Math.floor(offsetWidth / 42);
    const res = spliceArray(rowLength || 7);
    setEmojiLists(res);
    setEmojiListsShowing(res);
    setState('view_full_lists');
};

export const scrollFn = (
    e: React.UIEvent<HTMLDivElement>, elements: Element[], current: number, isOpen: string | undefined, 
    setCurrent: React.Dispatch<number>, setEmojiSkinTones: React.Dispatch<emojiSkinTonesType | null>
) => {
    const { bottom } = e.currentTarget.getBoundingClientRect();
    if(elements) {
        let mx = 0, i = 0;
        for(const ele of elements) {
            if(ele.getBoundingClientRect().top <= bottom) mx = i;
            i++;
        }
        if(mx !== current) setCurrent(mx);
    }
    if(isOpen) setEmojiSkinTones(null);
}

export const searchFnc = (search: string, offsetWidth: number, setEmojiListsShowing: React.Dispatch<emoji[]>) => {
    if(!offsetWidth) return;
    const rowLength = Math.floor(offsetWidth/ 42);
    const res = [], rep = [];
    let i = 0;
    for(let list of emoji_lists) {
        const { lists } = list;
        while(i < lists.length) {
            if(lists[i].name.find(n => n.includes(search))) rep.push(lists[i]);
            i++; 
        }
        i = 0;
    }
    i = 0;
    while(i < rep.length) {
        res.push(rep.slice(i, i + rowLength));
        i += rowLength;
    }
    setEmojiListsShowing([{ title: 'Search', lists: res }]);
}

export const getEmojiSkintonesModalPositions = (ele: HTMLDivElement, width: number) => {
    const { top, right } = ele.getBoundingClientRect();
    const pos: { [key: string]: string } = {};
    pos.top = (top - 55) + 'px';
    if(right < width) pos.left = '5px';
    else pos.left = (right - width) + 'px';
    const tick = { left: (right - 10) + 'px', top: (top - 5) + 'px' };
    return { pos, tick };
};