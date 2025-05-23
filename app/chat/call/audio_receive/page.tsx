import { Suspense } from "react";
import CallLoading from "../callLoading";
import AudioReceive from "./audioReceive";
import styles from "../call.module.css";

export default async function AudioReceivePage(
    { searchParams } : 
    { searchParams: Promise<{ back?: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <div className={styles.Call_}>
            <Suspense fallback={<CallLoading />}>
                <AudioReceive backPage={back} />
            </Suspense>
        </div>
    );
};