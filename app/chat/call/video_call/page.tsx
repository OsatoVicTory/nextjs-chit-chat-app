import { Suspense } from "react";
import CallLoading from "../callLoading";
import VideoCall from "./videoCall";

export default async function VideoCallPage(
    { searchParams } : 
    { searchParams: Promise<{ [key: string]: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <Suspense fallback={<CallLoading />}>
            <VideoCall backPage={back} />
        </Suspense>
    );
};