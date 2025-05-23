import { Suspense } from "react";
import CallLoading from "../callLoading";
import VideoReceive from "./videoReceive";

export default async function VideoReceivePage(
    { searchParams } : 
    { searchParams: Promise<{ [key: string]: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <Suspense fallback={<CallLoading />}>
            <VideoReceive backPage={back} />
        </Suspense>
    );
};