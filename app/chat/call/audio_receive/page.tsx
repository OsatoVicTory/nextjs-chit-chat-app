import { Suspense } from "react";
import CallLoading from "../callLoading";
import AudioReceive from "./audioReceive";

export default async function AudioReceivePage(
    { searchParams } : 
    { searchParams: Promise<{ [key: string]: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <Suspense fallback={<CallLoading />}>
            <AudioReceive backPage={back} />
        </Suspense>
    );
};