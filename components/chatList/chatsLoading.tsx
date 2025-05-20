"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./side.module.css";
import Skeleton from "./skeleton";

export default function ChatsLoading() {

    const skeletons = Array(8).fill(0);
    const pathname = usePathname();
    const [path, setPath] = useState<boolean>(false);

    useEffect(() => {
        setPath(pathname === "/chat");
    }, [pathname]);

    return (
        <aside className={`${styles.Chat_Lists} ${styles[`Chat_Lists_${path}`]}`}>
            <header className="w-full">
                <div className={styles.chat_header}>
                    <div>
                        <div className={styles.profile_avatar_loading}><Skeleton /></div>
                        <h2 className={`${styles.txt_white} ${styles.chat_lists_h2_loading}`}><Skeleton /></h2>
                    </div>
                </div>
                <div className={styles.chat_list_search}>
                    <div className={`${styles.cl_search} ${styles.cl_search_loading}`}>
                        <Skeleton />
                    </div>
                </div>
            </header>
            <div className={`${styles.chat_lists_container} w-full`}>
                <div className={`${styles.chat_lists_wrapper} w-full`}>
                    <ul className={styles.chat_lists}>
                        {skeletons.map((_, idx) => (
                            <li key={`chat-lists-${idx}`} className={styles.chat_list} style={{top: (70 * idx)+"px"}}>
                                <div className={`${styles.chat_list_div} w-full`}>
                                    <div className={styles.profile_avatar_loading}><Skeleton /></div>
                                    <div className={styles.chat_texts}>
                                        <div className={`${styles.ct_top} w-full`}>
                                            <h3 className={`${styles.txt_white} ${styles.h3_loading}`}><Skeleton /></h3>
                                            <span className={`${styles.txt_white} ${styles.span_loading}`}><Skeleton /></span>
                                        </div>
                                        <div className={`${styles.ct_base} w-full ${styles.loading}`}>
                                            <span className={styles.txt_white}><Skeleton /></span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </aside>
    );
};
