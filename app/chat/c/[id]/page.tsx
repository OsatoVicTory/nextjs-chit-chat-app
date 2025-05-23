import styles from "../../chat.module.css";
import Chat from "./chat";

type Params = Promise<{ id: string }>;

export default async function ChatMain({ params } : { params: Params }) {
    const { id } = await params;
    
    return (
        <main className={styles.chat_main_}>
            <Chat id={id} />
        </main>
    );
}