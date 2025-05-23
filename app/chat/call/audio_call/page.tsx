// import { Suspense } from "react";
// import CallLoading from "../callLoading";
import AudioCall from "./audioCall";
import styles from "../call.module.css";

export default async function AudioCallPage(
    { searchParams } : 
    { searchParams: Promise<{ back?: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <div className={styles.Call_}>
            <AudioCall backPage={back} />
        </div>
    );
};