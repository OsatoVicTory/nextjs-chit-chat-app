import styles from "./chat.module.css";

export default function App() {
    return (
        <main className={styles.chat_main_home}>
            <div className={`${styles.chat_Main} ${styles.chat_Main_Home} w-full h-full`}>
                <h1>App No Chat page</h1>
                <p>Click a chat by the side to start a conversation</p>
            </div>
        </main>
    )
};