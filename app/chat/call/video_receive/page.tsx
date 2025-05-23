// import { Suspense } from "react";
// import CallLoading from "../callLoading";
import VideoReceive from "./videoReceive";
import styles from "../call.module.css";

export default async function VideoReceivePage(
    { searchParams } : 
    { searchParams: Promise<{ back?: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <div className={styles.Call_}>
            <VideoReceive backPage={back} />
        </div>
    );
};