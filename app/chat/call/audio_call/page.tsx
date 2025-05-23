import { Suspense } from "react";
import CallLoading from "../callLoading";
import AudioCall from "./audioCall";

export default async function AudioCallPage(
    { searchParams } : 
    { searchParams: Promise<{ [key: string]: string | undefined }>}
) {
    const { back } = await searchParams;

    return (
        <Suspense fallback={<CallLoading />}>
            <AudioCall backPage={back} />
        </Suspense>
    );
};