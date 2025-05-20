"use client";

import emojiRegex from "emoji-regex";
import styles from "@/components/chatFooter/editor.module.css";
import { getEmojiStyles } from "./_emoji_render";

type Ele = {
    ele: string;
    className: string;
    str: string;
};

type ResolvedType = { 
    pref: string, 
    suf: string; 
    index_start: number; 
    index_end: number; 
    ele: string; 
    className: string; 
}

export const e_ctrls : Ele[] = [
    { ele: "strong", className: "bold", str: "|**|" },
    { ele: "i", className: "italics", str: "|~~|" },
    { ele: "strike", className: "line-through", str: "|--|" },
    { ele: "u", className: "under-line", str: "|__|" },
    { ele: "blockquote", className: "quote", str: ">  <" },
    { ele: "ul", className: "ul", str: ">><<" },
    { ele: "code", className: "code", str: "!__!" },
    { ele: "mark", className: "highlight", str: "|``|" },
];

export const getElementDetails = (ele : string) : Ele | null => {
    return e_ctrls.find(_e => (_e.className === ele || _e.str === ele || _e.ele === ele)) || null;
};

export const _fragmentsMatches = [
    "|*", "|~", "|_", "|-", "!_", "|`", ">>", "> ", // from here are suf part
    "*|", "~|", "_|", "-|", "_!", "`|", "<<", " <"
];

export const reverseString = (str : string) => {
    let res = "", found = false;
    for(let i = str.length - 1; i >= 0; i--) {
        if(str[i] === "<") res += ">";
        else if(str[i] === ">") res += "<";
        // else if(str[i] === "\n") found = true;
        else res += str[i];
    }
    return res;
};

export const isPref = (str : string) => {
    const f = str[0];
    return f === "|" || f === "!" || f === ">" || f === "\n";
};

export const _getSelectionString = () => {
    const sel : Selection | null = window.getSelection();
    return sel?.toString() || "";
};

export const _computeLen = (texts : string, rangeStr : string) => {
    let len = 0, str = "";
    let i = texts.length - 1, j = rangeStr.length - 1;
    while(i >= 0 && j >= 0) {
        if(texts[i] === rangeStr[j]) {
            str = texts[i] + str;
            i--;
            j--;
            len++;
        } else {
            if(j >= i) j--;
            else i--;
        }
    }
    while(i >= 0) str = texts[i--] + str;
    return { len, str };
};

export const getSelectionNode = (ele : HTMLDivElement) => {
    let caretOffset = 0, endContainer = null;
    const win = window;
    let actual_selection = "";
    if(typeof win.getSelection !== 'undefined') {
        const sel : Selection | null = win.getSelection();
        if(sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            endContainer = range.endContainer;
            actual_selection = sel.toString();
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(ele);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } 
    return { caretOffset, endContainer, actual_selection };
};

// use focus event for this
export const findSelectedFrags = (ty : string, ele : HTMLDivElement) => {
    let { endContainer, actual_selection } = getSelectionNode(ele);
    const caretOffset = actual_selection.length;
    let cnt = 0;
    let node : HTMLElement | Node | null = endContainer;
    // console.log("node", ty, node, caretOffset, node?.textContent);
    if(!endContainer || !node?.textContent) return [];
    const fragsClassName : { [key: string] : boolean; } = {};
    const par = styles.span_Parent;
    const par_ = styles.parentContentEditable;
    while(!(node instanceof HTMLElement) || (node.className !== par && node.className !== par_)) {
        let className : string = "";
        if(!(node instanceof HTMLElement)) cnt = 0;
        else {
            cnt = node.innerText.length;
            className = node.className;
        }
        
        if(cnt >= caretOffset && className) {
            const _className = e_ctrls.find(v => className.includes(v.className))?.className || "";
            fragsClassName[_className] = true;
        }
        node = node?.parentNode || null;
    }
    return Object.keys(fragsClassName);
};

export const _splitForFrags = (string : string) => {
    const _splits : [string, number][] = [];
    for(let i = 0; i < string.length; i++) {
        const _found = _fragmentsMatches.find(_f => string.slice(i, i + _f.length) === _f);
        if(_found) {
            _splits.push([_found, i]);
            i += _found.length - 1;
        }
    }
    return _splits;
};

export const _generatePrefRegistry = () => {
    const prefReg : { [key: string] : [string, number][]; } = {};
    for(let i = 0; i < _fragmentsMatches.length; i++) {
        if(_fragmentsMatches[i] === "*|") break;
        prefReg[_fragmentsMatches[i]] = [];
    }
    return prefReg;
}

export const _generateResolves = (string : string) => {
    const _splits = _splitForFrags(string);
    const prefRegistry = _generatePrefRegistry();
    const resolved : ResolvedType[] = [];

    function _cleanup(lstIndex : number) {
        Object.keys(prefRegistry).forEach(p => {
            let _p = prefRegistry[p].pop();
            while(_p && _p[1] >= lstIndex) _p = prefRegistry[p].pop();
            if(_p) prefRegistry[p].push(_p);
        });
    };

    let _i = 0;
    for(let i = 0; i < string.length; i++) {
        const _spl = _splits[_i];
        if(_spl && _spl[1] === i) {
            const str : string = _spl[0];
            if(isPref(str)) {
                prefRegistry[str].push(_spl);
            } else {
                const _pref = reverseString(str);
                const lst = prefRegistry[_pref].pop();
                if(lst) {
                    const _f = getElementDetails(_pref + str);
                    if(_f) {
                        const { ele, className } = _f;
                        resolved.push({ pref: _pref, suf: str, index_start: lst[1], index_end: i, ele, className });
                    }
                    _cleanup(lst[1]);
                }
            }
            i = i + str.length - 1;
            _i++;
        } 
    }
    return { _splits, resolved: resolved.sort((x, y) => x.index_start - y.index_start || x.index_end - y.index_end) };
};

export const _generateHTML = (string : string, pos : number) => {
    const { resolved } = _generateResolves(string);
    const regex = emojiRegex();
    const m : [string, number][] = [];
    // this method is more efficient and accurate than iterating over all characters and doing regex.test()
    string.matchAll(regex).forEach(_ => m.push([_[0], _["index"]]));
    m.reverse();
    let _i = 0;
    const ul : number[] = [];
    let node : HTMLElement = document.createElement("span");
    const parentClassName = styles.span_Parent;
    node.className = parentClassName;
    let caret : [HTMLElement | Node | null, number | null] = [null, null], cnt = 0, str = "";
    const res_memo : ResolvedType[] = [];
    let i = 0;
    
    function appendTextNodeIfExist() {
        if(str) {
            const nd = document.createTextNode(str);
            node.appendChild(nd);
            if(str.length + cnt >= pos && !caret[0]) caret = [nd, pos - cnt];
            cnt += str.length;
            str = "";
        }
    };

    function _trackBack(_i_ : number) {
        const _pop = res_memo.pop();
        if(_pop && _pop.index_end <= _i_) {
            appendTextNodeIfExist();
            const { suf } = _pop;
            const className = styles[_pop.className];
            if(className === styles.ul) ul.pop(); // using array cus, we can have nested lists
            while(node.className !== className && node.className !== parentClassName && node.parentElement) node = node.parentElement;
            const _suf = document.createElement("span");
            _suf.className = styles.pref_suf;
            const nd = document.createTextNode(suf);
            _suf.appendChild(nd);
            if(suf.length + cnt >= pos && !caret[0]) caret = [nd, pos - cnt];
            cnt += suf.length;
            node.appendChild(_suf);
            if(node.className !== parentClassName && node.parentElement) node = node.parentElement;
            return suf.length;
        } else {
            if(_pop) res_memo.push(_pop);
        }
        return null;
    };


    for(; i < string.length; i++) {

        const res = _trackBack(i);
        if(res !== null) {
            i += res - 1;
            continue;
        }

        const _ = m.pop();
        const _text = string[i];
        let found_emoji = false;

        if(_i < resolved.length && i === resolved[_i].index_start) {
            appendTextNodeIfExist();
            const { ele, className, index_end, pref } = resolved[_i];
            res_memo.push(resolved[_i++]);
            if(ele === "ul") ul.push(index_end);
            const _ele = document.createElement(ele);
            if(className) _ele.className = styles[className];
            node.appendChild(_ele);
            node = _ele;
            const _pref = document.createElement("span");
            _pref.className = styles.pref_suf;
            const _prefNode = document.createTextNode(pref);
            _pref.appendChild(_prefNode);
            // use only greater here cus if it is equal set caret and start of the innerChild for example li child
            if(pref.length + cnt > pos && !caret[0]) caret = [_prefNode, pos - cnt];
            node.appendChild(_pref);
            if(ele === "ul") {
                const li = document.createElement("li");
                // if(pref.length + cnt >= pos && !caret[0]) caret = [li, 0];
                if(pref.length + cnt >= pos && !caret[0]) {
                    const nd = document.createTextNode("");
                    li.appendChild(nd);
                    caret = [nd, 0];
                }
                node.appendChild(li);
                node = li;
            } else {
                const _nd = document.createTextNode("");
                node.appendChild(_nd);
                if(pref.length + cnt >= pos && !caret[0]) caret = [_nd, 0];
            }
            cnt += pref.length;
            i += pref.length - 1;
        } else if(_ && _[1] === i) {
            found_emoji = true;
            appendTextNodeIfExist();
            const nd = document.createElement("span");
            const ndd = document.createTextNode(_[0]);
            const style = getEmojiStyles(_[0], 14.5);
            nd.className = styles.inline_emoji;
            Object.assign(nd.style, style);
            nd.appendChild(ndd);
            node.appendChild(nd);
            if(_[0].length + cnt >= pos && !caret[0]) caret = [ndd, _[0].length]; // safe to just not put caret near it
            i += _[0].length - 1;
            cnt += _[0].length;
        } else { 
            if(_text === "\n") { 
                appendTextNodeIfExist();
                if(ul.length > 0) {
                    const _nd = document.createTextNode(_text);
                    node.appendChild(_nd);

                    while(node.nodeName !== "LI" && node.className !== parentClassName && node.parentElement) {
                        node = node.parentElement;
                    }
                    if(node.nodeName === "LI" && node.parentElement) node = node.parentElement;
                    const li = document.createElement("li");
                    node.appendChild(li);
                    node = li;
                    const nd = document.createTextNode(""); //(_text);
                    node.appendChild(nd);
                    if(_text.length + cnt >= pos && !caret[0]) caret = [nd, 0]; //pos - cnt];
                } else if(_text.length + cnt >= string.length) {
                    const br = document.createElement("p");
                    br.innerHTML = "<br>";
                    br.innerText = _text;
                    node.appendChild(br);
                    if(_text.length + cnt >= pos && !caret[0]) caret = [br, 0];
                } else {
                    const nd = document.createTextNode(_text);
                    node.appendChild(nd);
                    if(_text.length + cnt >= pos && !caret[0]) caret = [nd, pos - cnt];
                }
                cnt += _text.length;
            } else {
                str += _text;
            }
        }

        if(!found_emoji && _) m.push(_);
    }
    
    appendTextNodeIfExist();
    if(!caret[0]) {
        const nd = document.createTextNode("");
        node.appendChild(nd);
        caret = [nd, 0];
    }
    while(node.className !== parentClassName && node.parentElement) node = node.parentElement;
    return { html: node, caret };
};


export const _genHTML = (string : string) => {
    const { resolved } = _generateResolves(string);
    const regex = emojiRegex();
    const m : [string, number][] = [];
    // this method is more efficient and accurate than iterating over all characters and doing regex.test()
    string.matchAll(regex).forEach(_ => m.push([_[0], _["index"]]));
    m.reverse();
    let _i = 0;
    const ul : number[] = [];
    let node : HTMLElement = document.createElement("span");
    const parentClassName = styles.span_Parent;
    node.className = parentClassName;
    let caret : [HTMLElement | Node | null, number | null] = [null, null], str = "";
    const res_memo : ResolvedType[] = [];
    let i = 0;
    
    function appendTextNodeIfExist() {
        if(str) {
            const nd = document.createTextNode(str);
            node.appendChild(nd);
            str = "";
        }
    };

    function _trackBack(_i_ : number) {
        const _pop = res_memo.pop();
        if(_pop && _pop.index_end <= _i_) {
            appendTextNodeIfExist();
            const { suf } = _pop;
            const className = styles[_pop.className];
            if(className === styles.ul) ul.pop(); // using array cus, we can have nested lists
            while(node.className !== className && node.className !== parentClassName && node.parentElement) node = node.parentElement;
            if(node.className !== parentClassName && node.parentElement) node = node.parentElement;
            return suf.length;
        } else {
            if(_pop) res_memo.push(_pop);
        }
        return null;
    };


    for(; i < string.length; i++) {

        const res = _trackBack(i);
        if(res !== null) {
            i += res - 1;
            continue;
        }

        const _ = m.pop();
        const _text = string[i];
        let found_emoji = false;

        if(_i < resolved.length && i === resolved[_i].index_start) {
            appendTextNodeIfExist();
            const { ele, className, index_end, pref } = resolved[_i];
            res_memo.push(resolved[_i++]);
            if(ele === "ul") ul.push(index_end);
            const _ele = document.createElement(ele);
            if(className) _ele.className = styles[className];
            node.appendChild(_ele);
            node = _ele;
            if(ele === "ul") {
                const li = document.createElement("li");
                node.appendChild(li);
                node = li;
            } else {
                const _nd = document.createTextNode("");
                node.appendChild(_nd);
            }
            i += pref.length - 1;
        } else if(_ && _[1] === i) {
            found_emoji = true;
            appendTextNodeIfExist();
            const nd = document.createElement("span");
            nd.innerHTML = _[0];
            const style = getEmojiStyles(_[0], 14);
            nd.className = styles.inline_emoji;
            Object.assign(nd.style, style);
            node.appendChild(nd);
            i += _[0].length - 1;
        } else { 
            if(_text === "\n") { 
                appendTextNodeIfExist();
                if(ul.length > 0) {
                    const _nd = document.createTextNode(_text);
                    node.appendChild(_nd);

                    while(node.nodeName !== "LI" && node.className !== parentClassName && node.parentElement) {
                        node = node.parentElement;
                    }
                    if(node.nodeName === "LI" && node.parentElement) node = node.parentElement;
                    const li = document.createElement("li");
                    node.appendChild(li);
                    node = li;
                    const nd = document.createTextNode(""); //(_text);
                    node.appendChild(nd);
                } else {
                    const nd = document.createTextNode(_text);
                    node.appendChild(nd);
                }
            } else {
                str += _text;
            }
        }

        if(!found_emoji && _) m.push(_);
    }
    
    appendTextNodeIfExist();
    if(!caret[0]) {
        const nd = document.createTextNode("");
        node.appendChild(nd);
        caret = [nd, 0];
    }
    while(node.className !== parentClassName && node.parentElement) node = node.parentElement;
    return { html: node, caret };
};

export const _genHTMLForList = (string: string) => {
    const regex = emojiRegex();
    const m : [string, number][] = [];
    string.matchAll(regex).forEach(_ => m.push([_[0], _["index"]]));
    m.reverse();
    const node = document.createElement("span");
    let str = "";
    
    function appendTextNodeIfExist() {
        if(str) {
            const nd = document.createTextNode(str);
            node.appendChild(nd);
            str = "";
        }
    };

    for(let i = 0; i < string.length; i++) {
        const _found = _fragmentsMatches.find(_f => string.slice(i, i + _f.length) === _f);
        if(!_found) {
            const _ = m.pop();
            if(_ && _[1] === i) {
                appendTextNodeIfExist();
                const nd = document.createElement("span");
                nd.innerHTML = _[0];
                const style = getEmojiStyles(_[0], 14.4);
                nd.className = styles.inline_emoji;
                Object.assign(nd.style, style);
                node.appendChild(nd);
                i += _[0].length - 1;
            } else {
                if(_) m.push(_);
                str += string[i];
            }
        } else {
            i += _found.length - 1;
        }
    }
    appendTextNodeIfExist();
    return node;
};