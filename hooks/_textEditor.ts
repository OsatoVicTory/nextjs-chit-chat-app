"use client";

import { useCallback, useEffect, useRef } from "react";
import { _generateHTML, getElementDetails, getSelectionNode, findSelectedFrags, _getSelectionString, _computeLen } from "@/util/_input";
import styles from "@/components/chatFooter/editor.module.css";


type Frag = (res : string[]) => void;
type strFnType = (str: string) => void;
type blurFnType = () => void;

const useTextEditor = (
    inputref : React.RefObject<HTMLDivElement | null>, 
    placeholderref: React.RefObject<HTMLSpanElement | null>,
    strFn: strFnType, blurFn: blurFnType, changeFrag : Frag
) => {

    const rangeref = useRef<Range | null>(null);
    const selref = useRef<Selection | null>(null);
    const fragsref = useRef<string[]>([]);
    const posref = useRef<number>(0);
    const selectedref = useRef<string>("");
    const textref = useRef<string>("");
    const blurref = useRef<boolean>(false);

    const setCaret = useCallback((caretNode: HTMLElement | Node, offsetPos : number) => {
        if(rangeref.current && selref.current) {
            rangeref.current.setStart(caretNode, Math.max(0, offsetPos || 0));
            rangeref.current.collapse(true);
            selref.current.removeAllRanges();
            selref.current.addRange(rangeref.current);
        }
    }, []);
    
    // React.SyntheticEvent<HTMLDivElement, InputEvent>
    // React.FormEvent<HTMLDivElement>
    const handleInput = useCallback((e : Event) => {
        if(!inputref.current) return;
        const { inputType, data } = e as InputEvent;
        const caretOffset = posref.current;
        let rangeStr = selectedref.current;
        let eleString = "", backwards = false;
        if(inputType === "insertText" || inputType === "insertParagraph") {
            eleString = inputType === "insertParagraph" ? "\n" : (data || "");
        } else if(inputType === "deleteContentBackward") {
            if(!rangeStr) {
                rangeStr = " ";
                backwards = true;
            }
        }

        let texts = textref.current;

        let start = 0;
        let len = rangeStr.length;
        if(backwards) {
            len = 1;
        } else if(rangeStr.length > 0) {
            len = _computeLen(texts.slice(Math.max(0, caretOffset - rangeStr.length), caretOffset), rangeStr).len;
        }
        // console.log("sel", rangeStr, rangeStr.length, caretOffset, len, texts.slice(caretOffset - len, caretOffset));
        texts = texts.slice(0, Math.max(0, caretOffset - len)) + eleString + texts.slice(caretOffset);
        start = Math.max(0, caretOffset - len);
        
        textref.current = texts;
        posref.current = start + eleString.length;
        selectedref.current = "";
        // console.log("text", texts, texts.length, eleString, eleString.length, posref.current);

        strFn(textref.current);
        if(!textref.current) {
            const _html = document.createElement("div");
            _html.className = styles.div_Parent;
            const p = document.createElement("p");
            p.className = styles.p_start;
            p.innerHTML = "<br>";
            if(placeholderref.current) placeholderref.current.style.display = "inline-block";
            inputref.current.replaceChildren(_html);
            changeFrag([]);
            return;
        }

        const { html, caret } = _generateHTML(textref.current, posref.current);
        inputref.current.replaceChildren(html);
        if(caret[0] && caret[1] !== null) setCaret(caret[0], caret[1]);
        if(inputType === "deleteContentBackward") {
            const fragsClassName = findSelectedFrags("from deletion", inputref.current);
            fragsref.current = fragsClassName;
            changeFrag(fragsClassName);
        }

        if(placeholderref.current) {
            if(placeholderref.current.style.display !== "none") {
                placeholderref.current.style.display = "none";
            }
        }
    }, []);
    
    const runKeydown = useCallback((e : KeyboardEvent) => {
        const rangeStr_ = _getSelectionString();
        selectedref.current = rangeStr_ || "";

        if (/Mobi/.test(navigator.userAgent)) return;
        
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].find(val => val === e.key)) { 
            setTimeout(() => {
                if(!inputref.current) return;
                const { caretOffset } = getSelectionNode(inputref.current);
                // console.log("arrowkey", caretOffset)
                posref.current = caretOffset;
            }, 0); 
        } 
    }, []);

    const selFn = useCallback((v : string) => {
        if(!inputref.current) return;
        // if(blurref.current) return;
        const caretOffset = posref.current;
        let rangeStr = _getSelectionString();
        const eleString = getElementDetails(v)?.str || "";
        const half = Math.floor(eleString.length / 2);
        // console.log("caret", caretOffset);
        let texts = textref.current, len = rangeStr.length;
        if(rangeStr.length > 0) {
            const _ = _computeLen(texts.slice(Math.max(0, caretOffset - rangeStr.length), caretOffset), rangeStr);
            len = _.len;
            rangeStr = _.str;
        }
        const eleStr = eleString.slice(0, half) + rangeStr + eleString.slice(half);
        let start = 0;
        texts = texts.slice(0, caretOffset - len) + eleStr + texts.slice(caretOffset);
        start = caretOffset - len;
        textref.current = texts;
        start += Math.floor(half);
        const { html, caret } = _generateHTML(textref.current, start);
        if(!fragsref.current.includes(v)) fragsref.current.push(v);
        changeFrag(fragsref.current);
        inputref.current.replaceChildren(html);
        if(caret[0] && caret[1] !== null) setCaret(caret[0], caret[1]);
        posref.current = start;
        selectedref.current = "";

        if(placeholderref.current) {
            if(placeholderref.current.style.display !== "none") {
                placeholderref.current.style.display = "none";
            }
        }
        strFn(textref.current);
    }, []);

    const emojiClickFn = useCallback((emoji: string) => {
        if(!inputref.current) return;
        // if(blurref.current) return;
        const caretOffset = posref.current;
        let rangeStr = _getSelectionString();
        let texts = textref.current, len = rangeStr.length;
        if(rangeStr.length > 0) {
            const _ = _computeLen(texts.slice(Math.max(0, caretOffset - rangeStr.length), caretOffset), rangeStr);
            len = _.len;
            rangeStr = _.str;
        }
        let start = 0;
        texts = texts.slice(0, caretOffset - len) + emoji + texts.slice(caretOffset);
        start = caretOffset - len;
        textref.current = texts;
        start += emoji.length;
        const { html, caret } = _generateHTML(textref.current, start);
        inputref.current.replaceChildren(html);
        if(caret[0] && caret[1] !== null) setCaret(caret[0], caret[1]);
        posref.current = start;
        selectedref.current = "";

        if(placeholderref.current) {
            if(placeholderref.current.style.display !== "none") {
                placeholderref.current.style.display = "none";
            }
        }
        strFn(textref.current);
    }, []);

    const focused = useCallback(() => {
        blurref.current = false;
        // const fragsClassName = findSelectedFrags("focus", inputref.current);
        // fragsref.current = fragsClassName;
        // changeFrag(fragsClassName);
        // const { caretOffset } = getSelectionNode(inputref.current);
        // posref.current = caretOffset;
        const rangeStr_ = _getSelectionString();
        selectedref.current = rangeStr_ || "";
    }, []);

    const mouseUp = useCallback(() => {
        if(!inputref.current) return;
        const fragsClassName = findSelectedFrags("mouseup", inputref.current);
        fragsref.current = fragsClassName;
        changeFrag(fragsClassName);
        const { caretOffset } = getSelectionNode(inputref.current);
        // console.log("frags", fragsClassName, caretOffset);
        const rangeStr_ = _getSelectionString();
        posref.current = caretOffset;
        selectedref.current = rangeStr_ || "";
    }, []);

    const mouseDown = useCallback(() => {
        const rangeStr_ = _getSelectionString();
        // selectedref.current = rangeStr_ || "";
    }, []);

    const onBlur = useCallback(() => {
        blurref.current = true;
        blurFn();
    }, []);

    const focusDiv = useCallback(() => {
        if(inputref.current) {
            inputref.current.focus();
        }
    }, []);

    const clearFn = useCallback(() => {
        textref.current = "";
        selectedref.current = "";
        const _html = document.createElement("div");
        _html.className = styles.div_Parent;
        const p = document.createElement("p");
        p.className = styles.p_start;
        p.innerHTML = "<br>";
        if(placeholderref.current) placeholderref.current.style.display = "inline-block";
        if(inputref.current) inputref.current.replaceChildren(_html);
        changeFrag([]);
        strFn(textref.current);
    }, []);

    useEffect(() => {
        rangeref.current = document.createRange();
        selref.current = window.getSelection();

        const inp = inputref.current;
        const placeholderEle = placeholderref.current;

        if(placeholderEle) {
            placeholderEle.addEventListener("click", focusDiv);
        }

        if(inp) {
            inp.addEventListener("input", handleInput);
            inp.addEventListener("focus", focused);
            inp.addEventListener("blur", onBlur);
            inp.addEventListener("mouseup", mouseUp);
            inp.addEventListener("mouseup", mouseDown);
            inp.addEventListener('keydown', runKeydown);
        }

        return () => {
            if(placeholderEle) {
                placeholderEle.removeEventListener("click", focusDiv);
            }

            if(inp) {
                inp.removeEventListener("input", handleInput);
                inp.removeEventListener("focus", focused);
                inp.removeEventListener("blur", onBlur);
                inp.removeEventListener("mouseup", mouseUp);
                inp.removeEventListener("mouseup", mouseDown);
                inp.removeEventListener('keydown', runKeydown);
            }
        }
    }, []);

    return { selFn, emojiClickFn, clearFn };
};

export default useTextEditor;