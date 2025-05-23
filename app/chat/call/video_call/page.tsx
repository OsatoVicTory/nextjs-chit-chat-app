import { Suspense } from "react";
import CallLoading from "../callLoading";
import VideoCall from "./videoCall";
import styles from "../call.module.css";

export default async function VideoCallPage(
    { searchParams } : 
    { searchParams: Promise<{ back?: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <div className={styles.Call_}>
            <Suspense fallback={<CallLoading />}>
                <VideoCall backPage={back} />
            </Suspense>
        </div>
    );
};