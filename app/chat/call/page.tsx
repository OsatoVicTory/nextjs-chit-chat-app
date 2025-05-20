import styles from "../chat.module.css";

export default function CallPage() {
    return (
        <main className={styles.chat_main_home}>
            <div className={`${styles.chat_Main} ${styles.chat_Main_Home} w-full h-full`}>
                <h1>App No Call page</h1>
                <p>Click a chat by the side and locate the call button to start a call</p>
            </div>
        </main>
    )
};